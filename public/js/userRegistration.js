function sendUserInfo()
{
	var gender = document.getElementById('gender').value;
	var age = document.getElementById('age').value;
	var qual = document.getElementById('qualification').value;
	var isKannada = document.getElementById('isKannada').value;
	var consentType = document.getElementById('consentType').value;
	var uName = document.getElementById('username').value;

	$.ajax({
	    type: 'POST',
	    url: "/userInfo",
	    async: true,
	    data: 
	        JSON.stringify({
	            gender: gender,
	            age: age,
	            qual: qualification,
	            isKannada: isKannada,
	            consentType: consentType,
	            uName: uName,
	    }),
	    dataType: 'json',
	    contentType: 'application/json; charset=utf-8',
	    success: function ()
	    {
	    	alert('Registration is Successful.')
	    }
	});
}