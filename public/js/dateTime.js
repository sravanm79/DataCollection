/*
*   This script has been generated for the project titled
*   "Voice Data Collection for Psychiatric Evaluation and Research"
*   The original author of the script is
*   Swapnil S Sontakke, Project Associate, IIIT, Dharwad
*   Year: February, 2022
*   Version: 2
*/

/*
	This javascript file will give you the current date and time.
	This will be helpful for creating the file names as per
	recording date and time.
*/
function getDateTime()
{
	var dateTime = new Date();

	var day = dateTime.getDate();
	var month = dateTime.getMonth();
	var year = dateTime.getFullYear();
	var hours = dateTime.getHours();
	var minutes = dateTime.getMinutes();
	var seconds = dateTime.getSeconds();

	var currentDT = day + '-' + (month+1) + '-' + year + '_' + 
					hours + '-' + minutes + '-' + seconds;
	return currentDT;
}
