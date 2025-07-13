/*This is a videoStream javascript file which is responsible to
	1. Get access to the camera
	2. Record the video
	3. Save the video on cloud/local machine
	4. Play/Display the recorded video in another window 
*/
function getCameraStream()
{
	var video = document.getElementById("videoStream");

	if(navigator.mediaDevices.getUserMedia)
	{
	navigator.mediaDevices.getUserMedia({audio:true, video:true})
		.then(function(stream)
		{
			video.srcObject = stream;
		})
		catch(function(error)
		{
			console.log("Something went wrong. Cannot access the media device");
		})
	}
}

//Another Working Code
<script type="text/javascript">
		let video = document.querySelector("#videoStream");
		let mediaRecorder;
		navigator.mediaDevices.getUserMedia({
	    	video: true,
	    	audio: true
		}).then(function(mediaStreamObj)
		{
            //connect the media stream to the video element
            //let video = document.querySelector('#videoStream');
            //if ("srcObject" in video) {
            	video.srcObject = mediaStreamObj;
                mediaRecorder= new MediaRecorder(mediaStreamObj);
            //} else
            //{
                //old version
                //video.src = window.URL.createObjectURL(mediaStreamObj);
                //Recorder= new MediaRecorder(mediaStreamObj);
            //}
        });

		//Get two buttons to assign start and stop camera functionality
		//let start = document.getElementById('startVid');
        //let stop = document.getElementById('stopVid');
        
        let chunks = [];

        startCam.addEventListener('click', (ev)=>
        {
        	navigator.mediaDevices.getUserMedia
        	({
	    		video: true,
	    		audio: true
			}).then(function(mediaStreamObj)
			{
				video.srcObject = mediaStreamObj;
                mediaRecorder= new MediaRecorder(mediaStreamObj);
        	});
    	})
            
        startVid.addEventListener('click', (ev)=>{
            mediaRecorder.start();
            console.log(mediaRecorder.state);
        });

        stopVid.addEventListener('click', (ev)=>{
            mediaRecorder.stop();
            var video = document.querySelector("#videoStream");
			var stream = video.srcObject;
			var tracks = stream.getTracks();

			for (var i = 0; i < tracks.length; i++)
			{
				var track = tracks[i];
				track.stop();
 			}
    		video.srcObject = null;
            console.log(mediaRecorder.state);
        });

        mediaRecorder.ondataavailable = function(ev)
        {
            chunks.push(ev.data);
            console.log(chunks);
        }

        mediaRecorder.onstop = (ev)=>{
            let blob = new Blob(chunks, { 'type' : 'video/mp4;' });
            chunks = [];
            let videoURL = window.URL.createObjectURL(blob);
            vidSave.src = videoURL;
            const downloadLink = document.getElementById('download');
            downloadLink.href = URL.createObjectURL(new Blob(recordedChunks));
      		downloadLink.download = 'acetest.webm';
        }
	</script>