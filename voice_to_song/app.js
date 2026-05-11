const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recordBtn;
let transcriptEl;
let statusPanel;
let statusMessage;
let resultPanel;
let songTitleEl;
let songArtistEl;

let recognition = null;
let isRecording = false;
let finalTranscript = "";
let displayTranscript = "";

let session = null;

const schema = {
	type:"object", 
	properties: {
		song: {
			type:"string",
			description:"The song name."
		},
		artist: {
			type:"string",
			description:"The artist name."
		}
	},
	required: ["song", "artist"],
	additionalProperties: false
};

async function canDoIt() {
  if (!window.LanguageModel) {
    return false;
  }

  return (await LanguageModel.availability()) !== "unavailable";
}

function showUnsupportedMessage() {
  const notice = document.createElement("p");
  notice.className = "intro";
  notice.textContent =
    "Sorry, your browser doesn't support this. This must be run on Chrome 148 or later.";
  document.querySelector(".app")?.append(notice);
}

function setRecordingUi(recording) {
  isRecording = recording;
  recordBtn.classList.toggle("is-recording", recording);
  recordBtn.setAttribute("aria-pressed", String(recording));

  const icon = recordBtn.querySelector(".record-btn__icon");
  const label = recordBtn.querySelector(".record-btn__label");

  icon.classList.toggle("record-btn__icon--mic", !recording);
  icon.classList.toggle("record-btn__icon--stop", recording);
  label.textContent = recording ? "Stop" : "Start recording";
}

function resetOutput() {
  statusPanel.hidden = true;
  resultPanel.hidden = true;
  statusMessage.textContent = "";
  songTitleEl.textContent = "";
  songArtistEl.textContent = "";
}

function startRecording() {
  if (!SpeechRecognition) {
    transcriptEl.textContent =
      "Speech recognition is not supported in this browser. Try Chrome.";
    return;
  }

  resetOutput();
  finalTranscript = "";
  displayTranscript = "";
  transcriptEl.textContent = "Listening...";

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const text = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += `${text} `;
      } else {
        interimTranscript += text;
      }
    }

    displayTranscript = `${finalTranscript}${interimTranscript}`.trim();
    transcriptEl.textContent = displayTranscript || "Listening...";
  };

  recognition.onerror = (event) => {
    transcriptEl.textContent = `Recognition error: ${event.error}`;
    stopRecording();
  };

  recognition.onend = () => {
    if (isRecording) {
      recognition.start();
    }
  };

  recognition.start();
  setRecordingUi(true);
}

function stopRecording() {
  if (!recognition) {
    return;
  }

  setRecordingUi(false);
  recognition.onend = null;
  recognition.stop();
  recognition = null;

  const transcript = displayTranscript.trim() || finalTranscript.trim();
  if (transcript) {
    transcriptEl.textContent = transcript;
  }
  recognize(transcript);
}

async function recognize(transcript) {
  resetOutput();
  statusPanel.hidden = false;
  statusMessage.textContent = "Analyzing your dulcet tones...";

  if(!session) {
		session = await LanguageModel.create({
			initialInputs: [
        { 
						role: 'system', 
						content: 
							'You are a song id bot. Given lyrics, sometimes incorrect, you try to identity the song. You only return the song and artist.' 
					}
			],
			monitor(m) {
        m.addEventListener("downloadprogress", e => {
          if(e.loaded === 0 || e.loaded === 1) return;
          statusPanel.innerHTML = `Downloading, currently at ${Math.floor(e.loaded * 100)}%`;
        });
    	}	
		});
	}

  console.log(`Passing: ${transcript}`);
  let result = await session.prompt(
    [
      { role: 'user', content: transcript }
    ], { responseConstraint: schema });
  
  console.log(result);
  let { song, artist } = JSON.parse(result);
  songTitleEl.textContent = song;
  songArtistEl.textContent = artist;
  resultPanel.hidden = false;
}

function initApp() {
  recordBtn = document.getElementById("recordBtn");
  transcriptEl = document.getElementById("transcript");
  statusPanel = document.getElementById("statusPanel");
  statusMessage = document.getElementById("statusMessage");
  resultPanel = document.getElementById("resultPanel");
  songTitleEl = document.getElementById("songTitle");
  songArtistEl = document.getElementById("songArtist");

  document.querySelector(".controls").hidden = false;
  document.querySelector(".transcript-panel").hidden = false;

  recordBtn.addEventListener("click", () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const supported = await canDoIt();

  if (!supported) {
    showUnsupportedMessage();
    return;
  }

  initApp();
});
