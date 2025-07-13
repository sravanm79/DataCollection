class MyWorkletProcessor extends AudioWorkletProcessor
{
  constructor()
  {
    super();
  }

  process(inputs, outputs, parameters)
  {
	var wavesurfer = WaveSurfer.create({
		container: '#waveform',
		waveColor: 'violet',
		progressColor: 'purple'
	});

	wavesurfer.load('./recordings/10Sec_Jeevan.wav');
	}	
}

registerProcessor('my-worklet-processor', MyWorkletProcessor);