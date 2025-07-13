getSentenceBtn.addEventListener('click', (ev) =>
	{
		ev.preventDefault();
		document.getElementById('getUser').value = uname.value;
		var getUser = document.getElementById('uname').value;
    	var stNum = document.getElementById('stNumber').value;
    	var session = document.getElementById('eleCount').value;
    	if(getUser == '' || stNum == '' || session == '')
    	{
        		alert('Enter valid details');
        }
        else
        {
        	$.ajax({
			    type: 'POST',
			    url: "/getSentence",
			    async: true,
			    data: 
			        JSON.stringify({
			            user: getUser,
			            sentence: stNum,
			    }),
			    dataType: 'json',
			    contentType: 'application/json; charset=utf-8',
			    success: function () {
			    	var i = stNumber;
			    	document.getElementById('un').value = getUser.value;
	        		document.getElementById('sec').value = eleCount.value;
					$.get("/getSentence", function(data, status)
					{
				      	serverData = data;

						console.log(serverData);
			  			stNo.innerHTML = stNumber.value;
			    		sn.innerHTML = serverData[stNumber.value];
			    		preAudio.src = './data/'+stNumber.value+'.wav';

			    		setTimeout(function(){
						var audio = new Audio('./sounds/beep.mp3');
		        			audio.play();
			        	}, 5000);

			    		setTimeout(function(){
			    			document.getElementById('startVid').click();
			    			livewavesurfer.microphone.start();
			    		}, 7000);

			    		setTimeout(function() {
			    			document.getElementById('stopVid').click();
			    		}, 12000);
					});
				}
			});
    	}	
	});