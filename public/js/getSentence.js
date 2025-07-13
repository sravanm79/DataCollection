getSentenceBtn.addEventListener('click', (ev) =>
{
	$.ajax({
	    type: 'POST',
	    url: "/getSentence",
	    async: true,
	    data: 
	        JSON.stringify({
	            user: uname,
	            ele: eleCount,
	            rec: audioCount
	    }),
	    dataType: 'json',
	    contentType: 'application/json; charset=utf-8',
	    success: function () {
			const count = document.getElementById('audioCount').value;
			document.getElementById('un').value = uname.value;
			document.getElementById('sec').value = eleCount.value;
			console.log(count);
			var i=1, j=0, srid=0, stid=0, srdata=0, main = 0;

			$.get("/testing", function(data, status){

		    	//alert("Data: " + data + "\nStatus: " + status);
		    	//var data = JSON.parse(data);
		    	serverData = data;
		    	//alert(serverData);
		    	if(count=='')
					console.log("yyy",count);
				else
				{
					console.log(serverData);

			  		srdata = setInterval(function() {
			  			stNo.innerHTML = i;
			    		sn.innerHTML = serverData[i];
			    		if(i == count) {
			    			window.clearInterval(srdata);
			    		}
			  		}, 12000);	
					
					srid = setInterval(function() {	
						document.getElementById("startVid").click();
						if (i == count) {
					    	window.clearInterval(srid);
						}
					}, 7000);
					
					stid = setInterval(function()
					{
						document.getElementById("stopVid").click();
						if (i++ == count)
						{
						    window.clearInterval(stid);
						}
					}, 12000);
				}
			});
		}
	});
});