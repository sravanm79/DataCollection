function startCameraStream()
		{
			var video = document.querySelector("#videoStream");
  			navigator.mediaDevices.getUserMedia({
		    	video: true,
		    	audio: true
			}).then(
		  	stream => (video.srcObject = stream),
		  	err => console.log(err)
			);
		}

		function stopCameraStream(e)
		{
			var video = document.querySelector("#videoStream");
			var stream = video.srcObject;
			var tracks = stream.getTracks();

 			var shouldStop = true;
			var stopped = false;
			const downloadLink = document.getElementById('download');
			const stopButton = document.getElementById('stop');
    		for (var i = 0; i < tracks.length; i++)
			{
				var track = tracks[i];
				track.stop();
 			}
    		video.srcObject = null;
    	}