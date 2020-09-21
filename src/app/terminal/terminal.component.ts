import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Terminal, ITerminalOptions, ITheme } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Unicode11Addon } from 'xterm-addon-unicode11';

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss']
})
export class TerminalComponent implements AfterViewInit, OnDestroy, OnInit {
  @Input()
  user = '';

  @Input()
  hostname = '';

  private start = '\r\n$ ';

  private command = [];

  private term: any;

  @ViewChild('terminal', { static: true })
  private elementRef: ElementRef;

  @Input()
  private ws: WebSocket;


  ngOnInit(): void {

  }


  constructor() { }

  prompt() {
    this.term.write(this.start);
  }

  // 0	CONNECTING	Socket has been created. The connection is not yet open.
  // 1	OPEN	The connection is open and ready to communicate.
  // 2	CLOSING	The connection is in the process of closing.
  // 3	CLOSED	The connection is closed or couldn't be opened.
  ngAfterViewInit() {
    
      this.start = `\r\n\[${this.user}@${this.hostname}:]~$ `;
      const isWindows = ['Windows', 'Win16', 'Win32', 'WinCE'].indexOf(navigator.platform) >= 0;

      this.term = new Terminal({
        windowsMode: isWindows,
        cursorBlink: true,
        rows: 30,
        cols: 200,
        theme: {
          foreground: '#006612',
          background: 'black',
        }
      } as ITerminalOptions);

      this.term.open(this.elementRef.nativeElement);

      this.term.loadAddon(new FitAddon());
      this.term.loadAddon(new WebLinksAddon());
      this.term.loadAddon(new Unicode11Addon());
      this.term.focus();

      this.term.onKey((e: { key: string, domEvent: KeyboardEvent }) => {
        const ev = e.domEvent;
        const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
        if (ev.keyCode === 13) {
          this.prompt();
          this.ws.send(this.command.join(''));
          if (this.ws.readyState === 1) {

          }
          console.log('sending to ' + this.command);
          this.command = [];
        } else if (ev.keyCode === 8) {
          // Do not delete the prompt
          this.command.pop();
          console.log(this.term._core.buffer.x, this.start.length - 2);
          if (this.term._core.buffer.x > this.start.length - 2) {
            this.term.write('\b \b');
          }
          console.log('delete', this.command);
        } else if (printable) {
          this.term.write(e.key);
        }
        console.log(this.ws.readyState);
      });

      this.term.onData((data) => {
        this.command.push(data);
      });
      this.term.writeln('Welcome to stream sql playground');
      this.term.writeln('Welcome to stream sql playground');
      this.term.writeln('');
      this.prompt();

      this.term._initialized = true;

      this.ws.onmessage = (e) => {
        this.term.writeln('');
        this.term.writeln(e.data);
      };
    }

    ngOnDestroy(): void {
      this.term.dispose();
      this.ws.close();
    }
  }
