import { TerminalOutput, VirtualFile, NPMPackage, TerminalState } from '../types';
import { downloadAsZip } from './downloadUtils';

export class TerminalCommandProcessor {
  private state: TerminalState;
  private onCodeChange: (html: string, css: string, js: string) => void;
  private onThemeChange: (theme: 'dark' | 'light') => void;
  private onSnippetSave: (name: string, html: string, css: string, js: string) => void;
  private onSnippetLoad: (name: string) => void;
  private getCurrentCode: () => { html: string; css: string; javascript: string };
  private getSnippets: () => any[];

  constructor(
    initialState: TerminalState,
    callbacks: {
      onCodeChange: (html: string, css: string, js: string) => void;
      onThemeChange: (theme: 'dark' | 'light') => void;
      onSnippetSave: (name: string, html: string, css: string, js: string) => void;
      onSnippetLoad: (name: string) => void;
      getCurrentCode: () => { html: string; css: string; javascript: string };
      getSnippets: () => any[];
    }
  ) {
    this.state = initialState;
    this.onCodeChange = callbacks.onCodeChange;
    this.onThemeChange = callbacks.onThemeChange;
    this.onSnippetSave = callbacks.onSnippetSave;
    this.onSnippetLoad = callbacks.onSnippetLoad;
    this.getCurrentCode = callbacks.getCurrentCode;
    this.getSnippets = callbacks.getSnippets;
  }

  processCommand(input: string): TerminalOutput[] {
    const trimmed = input.trim();
    if (!trimmed) return [];

    const [command, ...args] = trimmed.split(' ');
    const cmd = command.toLowerCase();

    try {
      switch (cmd) {
        case 'help':
          return this.showHelp();
        case 'clear':
          return []; // Special case - handled by terminal component
        case 'run':
          return this.runCode();
        case 'download':
          return this.downloadCode();
        case 'theme':
          return this.changeTheme(args[0]);
        case 'save':
          return this.saveSnippet(args);
        case 'load':
          return this.loadSnippet(args);
        case 'npm':
          return this.handleNpm(args);
        case 'fetch':
          return this.fetchResource(args);
        case 'ls':
        case 'dir':
          return this.listFiles(args);
        case 'cd':
          return this.changeDirectory(args);
        case 'mkdir':
          return this.makeDirectory(args);
        case 'touch':
          return this.createFile(args);
        case 'cat':
          return this.readFile(args);
        case 'rm':
          return this.removeFile(args);
        case 'pwd':
          return this.printWorkingDirectory();
        case 'echo':
          return this.echo(args);
        case 'env':
          return this.showEnvironment();
        case 'history':
          return this.showHistory();
        case 'whoami':
          return this.whoami();
        case 'date':
          return this.showDate();
        case 'version':
        case '--version':
          return this.showVersion();
        case 'status':
          return this.showStatus();
        default:
          return this.unknownCommand(command);
      }
    } catch (error) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      }];
    }
  }

  private showHelp(): TerminalOutput[] {
    const helpText = `
╭─────────────────────────────────────────────────────────────╮
│                    POLYGLOT STUDIO TERMINAL                 │
├─────────────────────────────────────────────────────────────┤
│ CODE COMMANDS                                               │
│   run                    Execute current HTML/CSS/JS code  │
│   download               Export code as ZIP file           │
│   theme <dark|light>     Switch UI theme                   │
│                                                             │
│ SNIPPET COMMANDS                                            │
│   save snippet <name>    Save current code as snippet      │
│   load snippet <name>    Load snippet by name              │
│                                                             │
│ NPM SIMULATION                                              │
│   npm install <pkg>      Install package (simulated)       │
│   npm uninstall <pkg>    Uninstall package                 │
│   npm list               Show installed packages           │
│   npm search <query>     Search for packages               │
│                                                             │
│ FILE SYSTEM                                                 │
│   ls, dir                List directory contents           │
│   cd <path>              Change directory                  │
│   mkdir <name>           Create directory                  │
│   touch <file>           Create empty file                 │
│   cat <file>             Display file contents            │
│   rm <file>              Remove file                      │
│   pwd                    Show current directory           │
│                                                             │
│ NETWORK COMMANDS                                            │
│   fetch <url>            Download resource from URL        │
│                                                             │
│ SYSTEM COMMANDS                                             │
│   clear                  Clear terminal                    │
│   history                Show command history              │
│   env                    Show environment variables        │
│   echo <text>            Display text                      │
│   whoami                 Show current user                 │
│   date                   Show current date/time            │
│   version                Show version information          │
│   status                 Show system status                │
│   help                   Show this help message            │
╰─────────────────────────────────────────────────────────────╯`;

    return [{
      id: Date.now().toString(),
      type: 'info',
      message: helpText,
      timestamp: new Date().toISOString(),
    }];
  }

  private runCode(): TerminalOutput[] {
    return [{
      id: Date.now().toString(),
      type: 'success',
      message: '✅ Code executed successfully! Check the preview panel for results.',
      timestamp: new Date().toISOString(),
    }];
  }

  private downloadCode(): TerminalOutput[] {
    const code = this.getCurrentCode();
    downloadAsZip(code.html, code.css, code.javascript);
    
    return [{
      id: Date.now().toString(),
      type: 'success',
      message: '📦 Code exported as ZIP file successfully!',
      timestamp: new Date().toISOString(),
    }];
  }

  private changeTheme(theme?: string): TerminalOutput[] {
    if (!theme || !['dark', 'light'].includes(theme)) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: theme <dark|light>',
        timestamp: new Date().toISOString(),
      }];
    }

    this.onThemeChange(theme as 'dark' | 'light');
    
    return [{
      id: Date.now().toString(),
      type: 'success',
      message: `🎨 Theme changed to ${theme}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private saveSnippet(args: string[]): TerminalOutput[] {
    if (args.length < 2 || args[0] !== 'snippet') {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: save snippet <name>',
        timestamp: new Date().toISOString(),
      }];
    }

    const name = args.slice(1).join(' ');
    const code = this.getCurrentCode();
    this.onSnippetSave(name, code.html, code.css, code.javascript);

    return [{
      id: Date.now().toString(),
      type: 'success',
      message: `💾 Snippet "${name}" saved successfully!`,
      timestamp: new Date().toISOString(),
    }];
  }

  private loadSnippet(args: string[]): TerminalOutput[] {
    if (args.length < 2 || args[0] !== 'snippet') {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: load snippet <name>',
        timestamp: new Date().toISOString(),
      }];
    }

    const name = args.slice(1).join(' ');
    const snippets = this.getSnippets();
    const snippet = snippets.find(s => s.name === name);

    if (!snippet) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: `❌ Snippet "${name}" not found. Available snippets: ${snippets.map(s => s.name).join(', ')}`,
        timestamp: new Date().toISOString(),
      }];
    }

    this.onSnippetLoad(name);

    return [{
      id: Date.now().toString(),
      type: 'success',
      message: `📂 Snippet "${name}" loaded successfully!`,
      timestamp: new Date().toISOString(),
    }];
  }

  private handleNpm(args: string[]): TerminalOutput[] {
    if (args.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'info',
        message: 'npm <command>\n\nCommands:\n  install <package>  Install a package\n  uninstall <package>  Uninstall a package\n  list  List installed packages\n  search <query>  Search for packages',
        timestamp: new Date().toISOString(),
      }];
    }

    const [subcommand, ...subargs] = args;

    switch (subcommand) {
      case 'install':
        return this.npmInstall(subargs);
      case 'uninstall':
        return this.npmUninstall(subargs);
      case 'list':
        return this.npmList();
      case 'search':
        return this.npmSearch(subargs);
      default:
        return [{
          id: Date.now().toString(),
          type: 'error',
          message: `❌ Unknown npm command: ${subcommand}`,
          timestamp: new Date().toISOString(),
        }];
    }
  }

  private npmInstall(packages: string[]): TerminalOutput[] {
    if (packages.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: npm install <package>',
        timestamp: new Date().toISOString(),
      }];
    }

    const results: TerminalOutput[] = [];

    packages.forEach(pkg => {
      // Simulate package installation
      const packageInfo: NPMPackage = {
        name: pkg,
        version: this.generateRandomVersion(),
        description: `Simulated package: ${pkg}`,
        installed: new Date().toISOString(),
        size: Math.floor(Math.random() * 1000) + 100, // Random size in KB
      };

      this.state.npmPackages[pkg] = packageInfo;

      results.push({
        id: Date.now().toString() + Math.random(),
        type: 'success',
        message: `📦 Installing ${pkg}@${packageInfo.version}...`,
        timestamp: new Date().toISOString(),
      });

      results.push({
        id: Date.now().toString() + Math.random(),
        type: 'success',
        message: `✅ ${pkg}@${packageInfo.version} installed successfully (${packageInfo.size}KB)`,
        timestamp: new Date().toISOString(),
      });
    });

    // Save to localStorage
    localStorage.setItem('polyglot-npm-packages', JSON.stringify(this.state.npmPackages));

    return results;
  }

  private npmUninstall(packages: string[]): TerminalOutput[] {
    if (packages.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: npm uninstall <package>',
        timestamp: new Date().toISOString(),
      }];
    }

    const results: TerminalOutput[] = [];

    packages.forEach(pkg => {
      if (this.state.npmPackages[pkg]) {
        delete this.state.npmPackages[pkg];
        results.push({
          id: Date.now().toString() + Math.random(),
          type: 'success',
          message: `🗑️ ${pkg} uninstalled successfully`,
          timestamp: new Date().toISOString(),
        });
      } else {
        results.push({
          id: Date.now().toString() + Math.random(),
          type: 'error',
          message: `❌ Package ${pkg} is not installed`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Save to localStorage
    localStorage.setItem('polyglot-npm-packages', JSON.stringify(this.state.npmPackages));

    return results;
  }

  private npmList(): TerminalOutput[] {
    const packages = Object.values(this.state.npmPackages);
    
    if (packages.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'info',
        message: '📦 No packages installed',
        timestamp: new Date().toISOString(),
      }];
    }

    const packageList = packages.map(pkg => 
      `├── ${pkg.name}@${pkg.version} (${pkg.size}KB)`
    ).join('\n');

    return [{
      id: Date.now().toString(),
      type: 'info',
      message: `📦 Installed packages (${packages.length}):\n${packageList}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private npmSearch(query: string[]): TerminalOutput[] {
    if (query.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: npm search <query>',
        timestamp: new Date().toISOString(),
      }];
    }

    const searchTerm = query.join(' ');
    
    // Simulate search results
    const mockResults = [
      `${searchTerm}`,
      `${searchTerm}-utils`,
      `${searchTerm}-core`,
      `react-${searchTerm}`,
      `${searchTerm}-plugin`,
    ];

    const results = mockResults.map(pkg => 
      `📦 ${pkg}@${this.generateRandomVersion()} - Simulated package for ${searchTerm}`
    ).join('\n');

    return [{
      id: Date.now().toString(),
      type: 'info',
      message: `🔍 Search results for "${searchTerm}":\n${results}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private fetchResource(args: string[]): TerminalOutput[] {
    if (args.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: fetch <url>',
        timestamp: new Date().toISOString(),
      }];
    }

    const url = args[0];
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Invalid URL format',
        timestamp: new Date().toISOString(),
      }];
    }

    // Simulate fetch process
    const filename = url.split('/').pop() || 'resource';
    const size = Math.floor(Math.random() * 500) + 50;

    return [
      {
        id: Date.now().toString(),
        type: 'info',
        message: `🌐 Fetching ${url}...`,
        timestamp: new Date().toISOString(),
      },
      {
        id: Date.now().toString() + '1',
        type: 'success',
        message: `✅ ${filename} downloaded successfully (${size}KB)`,
        timestamp: new Date().toISOString(),
      },
      {
        id: Date.now().toString() + '2',
        type: 'info',
        message: `💡 Resource available for use in your project`,
        timestamp: new Date().toISOString(),
      }
    ];
  }

  private listFiles(args: string[]): TerminalOutput[] {
    const path = args[0] || this.state.currentDirectory;
    const files = Object.values(this.state.fileSystem)
      .filter(file => file.parent === path || (path === '/' && !file.parent));

    if (files.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'info',
        message: 'Directory is empty',
        timestamp: new Date().toISOString(),
      }];
    }

    const fileList = files.map(file => {
      const type = file.type === 'directory' ? 'd' : '-';
      const size = file.size ? `${file.size}B` : '-';
      const date = new Date(file.modified).toLocaleDateString();
      return `${type}rwxr-xr-x  1 user  staff  ${size.padStart(8)}  ${date}  ${file.name}`;
    }).join('\n');

    return [{
      id: Date.now().toString(),
      type: 'info',
      message: `📁 Contents of ${path}:\n${fileList}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private changeDirectory(args: string[]): TerminalOutput[] {
    if (args.length === 0) {
      this.state.currentDirectory = '/';
      return [{
        id: Date.now().toString(),
        type: 'success',
        message: '📁 Changed to home directory',
        timestamp: new Date().toISOString(),
      }];
    }

    const path = args[0];
    // Simulate directory change
    this.state.currentDirectory = path.startsWith('/') ? path : `${this.state.currentDirectory}/${path}`;

    return [{
      id: Date.now().toString(),
      type: 'success',
      message: `📁 Changed directory to ${this.state.currentDirectory}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private makeDirectory(args: string[]): TerminalOutput[] {
    if (args.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: mkdir <directory>',
        timestamp: new Date().toISOString(),
      }];
    }

    const dirName = args[0];
    const now = new Date().toISOString();
    
    this.state.fileSystem[dirName] = {
      name: dirName,
      type: 'directory',
      created: now,
      modified: now,
      parent: this.state.currentDirectory,
    };

    return [{
      id: Date.now().toString(),
      type: 'success',
      message: `📁 Directory "${dirName}" created`,
      timestamp: new Date().toISOString(),
    }];
  }

  private createFile(args: string[]): TerminalOutput[] {
    if (args.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: touch <filename>',
        timestamp: new Date().toISOString(),
      }];
    }

    const fileName = args[0];
    const now = new Date().toISOString();
    
    this.state.fileSystem[fileName] = {
      name: fileName,
      type: 'file',
      content: '',
      size: 0,
      created: now,
      modified: now,
      parent: this.state.currentDirectory,
    };

    return [{
      id: Date.now().toString(),
      type: 'success',
      message: `📄 File "${fileName}" created`,
      timestamp: new Date().toISOString(),
    }];
  }

  private readFile(args: string[]): TerminalOutput[] {
    if (args.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: cat <filename>',
        timestamp: new Date().toISOString(),
      }];
    }

    const fileName = args[0];
    const file = this.state.fileSystem[fileName];

    if (!file) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: `❌ File "${fileName}" not found`,
        timestamp: new Date().toISOString(),
      }];
    }

    if (file.type === 'directory') {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: `❌ "${fileName}" is a directory`,
        timestamp: new Date().toISOString(),
      }];
    }

    return [{
      id: Date.now().toString(),
      type: 'info',
      message: `📄 Contents of ${fileName}:\n${file.content || '(empty file)'}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private removeFile(args: string[]): TerminalOutput[] {
    if (args.length === 0) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: '❌ Usage: rm <filename>',
        timestamp: new Date().toISOString(),
      }];
    }

    const fileName = args[0];
    
    if (!this.state.fileSystem[fileName]) {
      return [{
        id: Date.now().toString(),
        type: 'error',
        message: `❌ File "${fileName}" not found`,
        timestamp: new Date().toISOString(),
      }];
    }

    delete this.state.fileSystem[fileName];

    return [{
      id: Date.now().toString(),
      type: 'success',
      message: `🗑️ File "${fileName}" removed`,
      timestamp: new Date().toISOString(),
    }];
  }

  private printWorkingDirectory(): TerminalOutput[] {
    return [{
      id: Date.now().toString(),
      type: 'info',
      message: this.state.currentDirectory,
      timestamp: new Date().toISOString(),
    }];
  }

  private echo(args: string[]): TerminalOutput[] {
    const message = args.join(' ');
    return [{
      id: Date.now().toString(),
      type: 'info',
      message: message,
      timestamp: new Date().toISOString(),
    }];
  }

  private showEnvironment(): TerminalOutput[] {
    const envVars = Object.entries(this.state.environment)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    return [{
      id: Date.now().toString(),
      type: 'info',
      message: `🌍 Environment Variables:\n${envVars}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private showHistory(): TerminalOutput[] {
    const history = this.state.commandHistory
      .map((cmd, index) => `${index + 1}  ${cmd}`)
      .join('\n');

    return [{
      id: Date.now().toString(),
      type: 'info',
      message: `📜 Command History:\n${history}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private whoami(): TerminalOutput[] {
    return [{
      id: Date.now().toString(),
      type: 'info',
      message: '👤 polyglot-developer',
      timestamp: new Date().toISOString(),
    }];
  }

  private showDate(): TerminalOutput[] {
    return [{
      id: Date.now().toString(),
      type: 'info',
      message: `📅 ${new Date().toString()}`,
      timestamp: new Date().toISOString(),
    }];
  }

  private showVersion(): TerminalOutput[] {
    return [{
      id: Date.now().toString(),
      type: 'info',
      message: `🚀 Polyglot Studio Terminal v1.0.0\nBuilt with React + TypeScript\nPowered by Monaco Editor`,
      timestamp: new Date().toISOString(),
    }];
  }

  private showStatus(): TerminalOutput[] {
    const code = this.getCurrentCode();
    const snippets = this.getSnippets();
    const packages = Object.keys(this.state.npmPackages);
    const files = Object.keys(this.state.fileSystem);

    const status = `
╭─────────────────────────────────────────╮
│              SYSTEM STATUS              │
├─────────────────────────────────────────┤
│ 📝 HTML Lines: ${code.html.split('\n').length.toString().padStart(8)}           │
│ 🎨 CSS Lines:  ${code.css.split('\n').length.toString().padStart(8)}           │
│ ⚡ JS Lines:   ${code.javascript.split('\n').length.toString().padStart(8)}           │
│ 💾 Snippets:   ${snippets.length.toString().padStart(8)}           │
│ 📦 Packages:   ${packages.length.toString().padStart(8)}           │
│ 📁 Files:      ${files.length.toString().padStart(8)}           │
│ 📍 Directory:  ${this.state.currentDirectory.padEnd(16)} │
╰─────────────────────────────────────────╯`;

    return [{
      id: Date.now().toString(),
      type: 'info',
      message: status,
      timestamp: new Date().toISOString(),
    }];
  }

  private unknownCommand(command: string): TerminalOutput[] {
    return [{
      id: Date.now().toString(),
      type: 'error',
      message: `❌ Command not found: ${command}\nType 'help' for available commands`,
      timestamp: new Date().toISOString(),
    }];
  }

  private generateRandomVersion(): string {
    const major = Math.floor(Math.random() * 5) + 1;
    const minor = Math.floor(Math.random() * 10);
    const patch = Math.floor(Math.random() * 20);
    return `${major}.${minor}.${patch}`;
  }

  getState(): TerminalState {
    return this.state;
  }

  updateState(newState: Partial<TerminalState>): void {
    this.state = { ...this.state, ...newState };
  }
}