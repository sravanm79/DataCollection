/*
*   This script has been generated for the project titled
*   "Digital Voice Recording - NAIN 2.0"
*   The original author of the script is
*   Swapnil S Sontakke, Project Associate, IIIT, Dharwad
*   Year: January, 2022
*   Version: 2
*/

/*	This function is resposonsible for updating the sentence number
*	as entered by the user.
*	This will allow the data associates to set any sentence number
*	and can start from any sentence number.
*/
const MIN=0, MAX=5000;
function updatePointer()
{
	setPtr.addEventListener('click', async (ev)=>
	{
		ev.preventDefault();
		let ptrValue = document.getElementById('sentenceNo').value;
		if(ptrValue == '')
		{
			console.log('No input from speaker.');
			alert('Enter a valid Sentence Number.');
		}
		else if(ptrValue < MIN || ptrValue >= MAX)
		{
			console.log('Invalid Sentence Number.');
			alert('Enter a valid Sentence Number.');
			document.getElementById('sentenceNo').value = '';
		}
		else
		{
			console.log('Value from User: ', ptrValue);
			$.ajax({
	            type: 'post',
	            url: "/setPointer",
	            async: true,
	            data: 
	                JSON.stringify({
	                    sentenceValue: ptrValue,
	            }),
	            dataType: 'json',
	            contentType: 'application/json; charset=utf-8',
	            success: function () {
	          //   	$.get('/go', async function(data, status)
        			// {
        			// 	let st = json.stringify(data);
        			// 	if(data=='1')
        			// 	{
        			// 		console.log('Done');
        			// 		alert('Done Danaa');
        			// 	}
        			// })
        			document.getElementById('sentenceNo').value = '';
        			alert('Sentence pointer updated successfully.');
	            }
        	})
        	document.getElementById('sentenceNo').value = '';
        	alert('Sentence pointer updated successfully.')
		}
	})
}