import { ZVM } from 'https://esm.sh/ifvms';

// ---- RefStruct / RefBox (plain functions to avoid transpilation issues) ----
function RefStruct() { this._fields = []; }
RefStruct.prototype.push_field = function(v) { this._fields.push(v); };
RefStruct.prototype.get_field = function(i) { return this._fields[i]; };
RefStruct.prototype.set_field = function(i, v) { this._fields[i] = v; };

function RefBox() { this.value = 0; }
RefBox.prototype.set_value = function(v) { this.value = v; };
RefBox.prototype.get_value = function() { return this.value; };

// ---- ZorkEngine ----
class ZorkEngine {
  constructor() {
    this._outputBuffer = '';
    this._glkEvent = null;
    this._inputBuf = null;
    this._inputWin = null;

    const self = this;
    this._glk = {
      RefStruct: RefStruct,
      RefBox: RefBox,

      update: function() {},
      fatal_error: function(e) { console.error('GLK FATAL:', e); },
      glk_exit: function() {},

      // Windows
      glk_window_open: function(split, method, size, wintype, rock) {
        return { _win: true, _type: wintype };
      },
      glk_window_close: function() { return { readcount: 0, writecount: 0 }; },
      glk_window_clear: function() {},
      glk_window_get_size: function(win, wRef, hRef) {
        if (wRef && wRef.set_value) wRef.set_value(80);
        if (hRef && hRef.set_value) hRef.set_value(24);
      },
      glk_window_get_stream: function(win) { return win; },
      glk_window_set_arrangement: function() {},
      glk_window_move_cursor: function() {},
      glk_window_iterate: function() { return null; },
      glk_window_get_parent: function() { return null; },
      glk_set_window: function() {},

      // Output
      glk_put_jstring: function(str) { self._outputBuffer += str; },
      glk_put_jstring_stream: function(stream, str) { self._outputBuffer += str; },
      glk_put_char_stream_uni: function(stream, ch) { self._outputBuffer += String.fromCodePoint(ch); },
      glk_put_buffer_stream: function(stream, buf) {
        self._outputBuffer += Array.from(buf).map(function(c) { return String.fromCodePoint(c); }).join('');
      },

      // Streams
      glk_stream_close: function() { return { readcount: 0, writecount: 0 }; },
      glk_stream_iterate: function() { return null; },
      glk_stream_open_file: function() { return null; },
      glk_stream_open_file_uni: function() { return null; },
      glk_get_line_stream_uni: function() { return -1; },
      glk_get_char_stream_uni: function() { return -1; },
      glk_get_buffer_stream: function() { return 0; },

      // Styles / misc
      glk_stylehint_set: function() {},
      glk_stylehint_clear: function() {},
      glk_set_style: function() {},
      glk_gestalt: function() { return 0; },
      save_allstate: function() { return null; },
      restore_allstate: function() {},
      glk_fileref_create_by_prompt: function() {},
      glk_fileref_destroy: function() {},
      garglk_set_reversevideo: function() {},
      garglk_set_reversevideo_stream: function() {},
      garglk_set_zcolors_stream: function() {},

      // Input
      glk_request_line_event_uni: function(win, buf, initlen) {
        self._inputBuf = buf;
        self._inputWin = win;
      },
      glk_request_char_event_uni: function(win) {
        self._inputWin = win;
      },

      // VM suspends here waiting for input
      glk_select: function(eventRef) {
        self._glkEvent = eventRef;
      },
    };
  }

  load(arrayBuffer) {
    const data = new DataView(arrayBuffer);
    this._vm = new ZVM();
    this._vm.prepare(data, { Glk: this._glk });
    this._vm.start();
  }

  getOutput() {
    const out = this._outputBuffer;
    this._outputBuffer = '';
    return out;
  }

  send(command) {
    if (!this._glkEvent) {
      console.warn('VM is not waiting for input');
      return '';
    }

    if (this._inputBuf) {
      for (let i = 0; i < command.length; i++) {
        this._inputBuf[i] = command.charCodeAt(i);
      }
    }

    const ev = this._glkEvent;
    ev.push_field(3);                 // evtype_LineInput
    ev.push_field(this._inputWin);    // window
    ev.push_field(command.length);    // char count
    ev.push_field(0);                 // terminator (Enter)

    this._glkEvent = null;
    this._inputBuf = null;
    this._outputBuffer = '';

    this._vm.resume();

    return this.getOutput();
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  const res = await fetch('zork1.b64.txt');
  const b64 = await res.text();
	
	// decode base64 → ArrayBuffer
  const binary = atob(b64.trim());
  const arrayBuffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
	
  const engine = new ZorkEngine();
  engine.load(arrayBuffer);
  console.log(engine.getOutput()); // intro text

  let response = engine.send('open mailbox');
  console.log(response);

  response = engine.send('take leaflet from mailbox');
  console.log(response);


});