// Netheron.exe: starts the bundled server (runtime\node.exe + app\), opens the workspace in its own
// window, and sits in the tray. Quit from the tray stops the server and every agent it started.
// Built by scripts/build-exe.ts with the C# compiler that ships with Windows (.NET Framework 4).
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

static class Netheron
{
    const string Health = "http://127.0.0.1:4142/";
    static string Base = AppDomain.CurrentDomain.BaseDirectory;
    static string Node = Path.Combine(Base, "runtime", "node.exe");
    static string App = Path.Combine(Base, "app");
    static string Cli = Path.Combine(App, "packages", "daemon", "src", "cli.ts");
    static string DataDir = Environment.GetEnvironmentVariable("MM_DATA_DIR") ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".mm");
    static string LogFile = Path.Combine(DataDir, "netheron.log");
    static Process server;
    static NotifyIcon tray;
    static bool quitting;

    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        bool first;
        using (var one = new Mutex(true, @"Local\NetheronLauncher", out first))
        {
            if (!first || Up()) { OpenWindow(); return; } // already running (this launcher or start-netheron.cmd)
            if (!File.Exists(Node) || !File.Exists(Cli)) { Fail("Netheron's files are incomplete. Unzip the whole Netheron folder again."); return; }
            Directory.CreateDirectory(DataDir);
            StartServer();
            if (!WaitUp(30)) { Stop(); Fail("Netheron did not start. Details are in:\n" + LogFile); return; }
            MakeTray();
            OpenWindow();
            Application.Run();
        }
    }

    static void StartServer()
    {
        var psi = new ProcessStartInfo(Node, Quote(Cli) + " serve")
        {
            WorkingDirectory = App,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };
        // Agents launched by Netheron find this node first (memory MCP server, scripts).
        psi.EnvironmentVariables["PATH"] = Path.GetDirectoryName(Node) + ";" + Environment.GetEnvironmentVariable("PATH");
        var log = new StreamWriter(LogFile, true) { AutoFlush = true };
        log.WriteLine("---- " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " start");
        server = new Process { StartInfo = psi, EnableRaisingEvents = true };
        server.OutputDataReceived += (s, e) => { if (e.Data != null) lock (log) log.WriteLine(e.Data); };
        server.ErrorDataReceived += (s, e) => { if (e.Data != null) lock (log) log.WriteLine(e.Data); };
        server.Exited += (s, e) =>
        {
            if (quitting || tray == null) return;
            tray.ShowBalloonTip(5000, "Netheron stopped", "The server exited. Details are in " + LogFile, ToolTipIcon.Error);
        };
        server.Start();
        server.BeginOutputReadLine();
        server.BeginErrorReadLine();
    }

    static bool Up()
    {
        try
        {
            var req = (HttpWebRequest)WebRequest.Create(Health);
            req.Timeout = 1000;
            using (req.GetResponse()) return true;
        }
        catch (WebException e) { return e.Response != null; } // 401 still means it is up
        catch { return false; }
    }

    static bool WaitUp(int seconds)
    {
        for (int i = 0; i < seconds * 4; i++)
        {
            if (Up()) return true;
            if (server.HasExited) return false;
            Thread.Sleep(250);
        }
        return false;
    }

    static string Link()
    {
        // `mm token` prints the workspace link with its access token.
        var psi = new ProcessStartInfo(File.Exists(Node) ? Node : "node", Quote(Cli) + " token")
        { WorkingDirectory = App, UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true };
        using (var p = Process.Start(psi))
        {
            string url = p.StandardOutput.ReadToEnd().Trim();
            p.WaitForExit();
            return url.StartsWith("http") ? url : Health;
        }
    }

    static void OpenWindow()
    {
        string url;
        try { url = Link(); } catch { url = Health; }
        string edge = FindEdge();
        try
        {
            if (edge != null)
            {
                // App mode: its own window and taskbar entry, no tabs or address bar. Uses your normal
                // Edge profile, so there is no first-run or sign-in prompt, and Edge remembers the size.
                Process.Start(edge, "--app=" + Quote(url));
            }
            else Process.Start(url);
        }
        catch (Exception e) { Fail("Could not open the window: " + e.Message); }
    }

    static void OpenInBrowser()
    {
        try { Process.Start(Link()); } catch { }
    }

    static string FindEdge()
    {
        foreach (var root in new[] { Environment.GetEnvironmentVariable("ProgramFiles(x86)"), Environment.GetEnvironmentVariable("ProgramFiles"), Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) })
        {
            if (string.IsNullOrEmpty(root)) continue;
            var p = Path.Combine(root, "Microsoft", "Edge", "Application", "msedge.exe");
            if (File.Exists(p)) return p;
        }
        return null;
    }

    static void MakeTray()
    {
        var menu = new ContextMenuStrip();
        menu.Items.Add("Open Netheron", null, (s, e) => OpenWindow());
        menu.Items.Add("Open in browser", null, (s, e) => OpenInBrowser());
        menu.Items.Add("Show log", null, (s, e) => { try { Process.Start("notepad.exe", Quote(LogFile)); } catch { } });
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Quit Netheron (stops all agents)", null, (s, e) => Quit());
        tray = new NotifyIcon
        {
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath),
            Text = "Netheron",
            ContextMenuStrip = menu,
            Visible = true,
        };
        tray.DoubleClick += (s, e) => OpenWindow();
        tray.ShowBalloonTip(4000, "Netheron is running", "It stays in the tray while agents work. Right-click the icon to quit.", ToolTipIcon.Info);
    }

    static void Quit()
    {
        quitting = true;
        Stop();
        if (tray != null) { tray.Visible = false; tray.Dispose(); }
        Application.Exit();
    }

    static void Stop()
    {
        if (server == null || server.HasExited) return;
        // The whole tree: the server plus the agent terminals it spawned.
        try
        {
            var kill = Process.Start(new ProcessStartInfo("taskkill", "/PID " + server.Id + " /T /F") { CreateNoWindow = true, UseShellExecute = false });
            kill.WaitForExit(5000);
        }
        catch { try { server.Kill(); } catch { } }
    }

    static void Fail(string msg)
    {
        MessageBox.Show(msg, "Netheron", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }

    static string Quote(string s) { return "\"" + s + "\""; }
}
