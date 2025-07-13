class MyWorkletNode extends AudioWorkletNode
{
	constructor(context)
	{
		super(context, 'my-worklet-processor');
	}
}

let context = new AudioContext();

context.audioWorklet.addModule('./js/processor.js').then(() =>
{
	let node = new MyWorkletNode(context);
});