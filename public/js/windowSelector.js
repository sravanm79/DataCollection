/*
*   This script has been generated for the project titled
*   "Digital Voice Recording - NAIN 2.0"
*   The original author of the script is
*   Swapnil S Sontakke, Project Associate, IIIT, Dharwad
*   Year: February, 2022
*   Version: 2
*/
/*
	This javascript file will hide/unhide the audio recording
	window based on the input received from the user (from the
	dropdown selection)
*/
function windowSelect()
{
	var option = document.getElementById('recWindow');	//Get user option

	//get div elements to record the audio
	var demoDiv = document.getElementById('demoCamera');
	var mainDivA = document.getElementById('accessCamera1');
	var mainDivM = document.getElementById('accessCamera2');
	var conDiv = document.getElementById('conCamera');

	//These div elements have input data such as speaker id, session no and no of recordings
	var demoDivdata = document.getElementById('demoDiv');	//Demo Recording
	var conDivdata = document.getElementById('conDiv');		//Continuous Recording
	var recordSectionA = document.getElementById('inputCount');	//Automatic Main Recording
	var recordSectionM = document.getElementById('inputCountM'); //Manual Main Recording
	var libraryAudio = document.getElementById('libAudio');		//Re-recording

	if(option.value == 'demo')
	{
		console.log('demo');
		demoDiv.style.display = 'inline';
		mainDivA.style.display = 'none';
		mainDivM.style.display = 'none';
		conDiv.style.display = 'none';

		demoDivdata.style.display = 'inline';
		conDivdata.style.display = 'none';
		recordSectionA.style.display = 'none';
		recordSectionM.style.display = 'none';
		libraryAudio.style.display = 'none';
	}
	else if(option.value == 'mainA')
	{
		console.log('main automatic');
		demoDiv.style.display = 'none';
		mainDivA.style.display = 'inline';
		mainDivM.style.display = 'none';
		conDiv.style.display = 'none';

		demoDivdata.style.display = 'none';
		conDivdata.style.display = 'none';
		recordSectionA.style.display = 'inline';
		recordSectionM.style.display = 'none';
		libraryAudio.style.display = 'none';
	}
	else if(option.value == 'mainM')
	{
		console.log('main manual');
		demoDiv.style.display = 'none';
		mainDivA.style.display = 'none';
		mainDivM.style.display = 'inline';
		conDiv.style.display = 'none';

		demoDivdata.style.display = 'none';
		conDivdata.style.display = 'none';
		recordSectionA.style.display = 'none';
		recordSectionM.style.display = 'inline';
		libraryAudio.style.display = 'none';
	}
	else if(option.value == 'continuous')
	{
		console.log('continuous');
		demoDiv.style.display = 'none';
		mainDivA.style.display = 'none';
		mainDivM.style.display = 'none';
		conDiv.style.display = 'inline';

		demoDivdata.style.display = 'none';
		conDivdata.style.display = 'inline';
		recordSectionA.style.display = 'none';
		recordSectionM.style.display = 'none';
		libraryAudio.style.display = 'none';
	}
	else if(option.value == 'reRecordWin')
	{
		console.log('Re-Recording window');
		demoDiv.style.display = 'none';
		mainDivA.style.display = 'inline';
		mainDivM.style.display = 'none';
		conDiv.style.display = 'none';

		demoDivdata.style.display = 'none';
		conDivdata.style.display = 'none';
		recordSectionA.style.display = 'none';
		recordSectionM.style.display = 'none';
		libraryAudio.style.display = 'inline';
	}
	else
	{
		console.log('No option selected');
	}
}