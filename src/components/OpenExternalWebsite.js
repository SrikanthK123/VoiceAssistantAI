import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faRedo } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { APIKey } from './Data';

const OpenExternalWebsite = () => {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [responseAnswer, setResponseAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');

  // Check for browser support
  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  // Start listening to the voice command
  const startListening = () => {
    setIsListening(true);
    setStatusMessage('');
    setResponseAnswer('');
    SpeechRecognition.startListening({ continuous: true });
  };

  // Stop listening and process the voice command
  const stopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();

    // Process the command after a short delay
    setTimeout(() => {
      handleVoiceCommand(transcript);
      resetTranscript();
      setStatusMessage('Processing your command... Please wait.');
    }, 1000);
  };

  // Function to handle the voice command
  const handleVoiceCommand = async (command) => {
    if (!command) {
      console.error('No transcript available');
      setShowAlert(true);
      return;
    }

    const formattedCommand = `${command.toLowerCase().trim()} url;`;
    console.log('Processing command:', formattedCommand);

    // Call processQuestion with the formatted command
    await processQuestion(formattedCommand);
  };

  // Function to process the question and get the answer
  const processQuestion = async (question) => {
    if (question.trim() === '') {
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    setShowAlert(false);

    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${APIKey}`,
        method: 'post',
        data: {
          contents: [{ parts: [{ text: question }] }]
        }
      });

      const receivedAnswer = response.data.candidates[0].content.parts[0].text;
      const formattedAnswer = receivedAnswer
        .replace(/Gemini/g, 'SriChat')
        .replace(/developed by Google/g, 'developed by Srikanth');

      setResponseAnswer(formattedAnswer);
      setShowAnswer(true);

      // Check if the answer contains a URL and open it
      const urlMatch = formattedAnswer.match(/https?:\/\/[^\s"]+/);
      if (urlMatch) {
        window.open(urlMatch[0], '_blank'); // Open the URL in a new tab
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }

    setUserQuestion(''); // Reset question after processing
  };

  // Restart the voice command
  const restartListening = () => {
    stopListening();
    resetTranscript();
    setStatusMessage('');
    setShowAlert(false);
    setIsListening(true);
    startListening();
  };

  return (
    <div className='p-4 bg-cyan-700'>
      <h1 className='text-xl text-center text-white'>Voice Command Interface for External Pages</h1>
      <div className='flex justify-center '> 
        {/* Microphone button to start/stop listening */}
      <button
        className={`text-white px-3 py-1 rounded-md shadow-lg m-4 hover:bg-cyan-600  transition duration-300 text-center ${listening ? 'bg-red-700' : ''}`}
        onClick={listening ? stopListening : startListening}
      >
        <FontAwesomeIcon icon={listening ? faMicrophoneSlash : faMicrophone} size="2x" /> 
      </button>

      {/* Restart the voice recognition */}
      <button
        className="text-white px-3 py-2 rounded-md hover:bg-cyan-600 transition duration-300 shadow-lg m-4 text-center"
        onClick={restartListening}
      >
        <FontAwesomeIcon icon={faRedo} size="2x" />
      </button>
      </div>
      

      {/* Status messages */}
      <div className="mt-4 text-white">
        {listening && <p>Listening... Speak now to give a command.</p>}
        {!listening && transcript && <p>Transcript: {transcript}</p>}
        {statusMessage && <p>{statusMessage}</p>}
        {showAlert && <p className="text-red-500">Please say something to proceed.</p>}
      </div>
      {isListening && (
        <div className="flex justify-center mt-4">
          <p className="text-slate-700">Transcript: <span className='text-white font-bold'>{transcript || "🤖 Please say something!"}</span></p>
        </div>
      )}

      {/* Show the response or loading message */}
      {isLoading && (
        <div className="mt-4 text-white">
          <p>Loading response, please wait...</p>
        </div>
      )}
    </div>
  );
};

export default OpenExternalWebsite;
