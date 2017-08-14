


function signUp() {

	 var email = $("#user_email").val();
	 var password = $("#user_password").val();
	 var confirmpass = $("#user_password_confirmation").val();

	
	 if( password !=confirmpass )
		 return;
	 //alert("clear all validation")
	 var sendInfo = {email: email,password: password};
	 	console.log(sendInfo.email+ " ::: "+ sendInfo.password);
	       $.ajax({
	    	   beforeSend: function(xhrObj){
	    	        xhrObj.setRequestHeader("Content-Type","application/json");
	    	        xhrObj.setRequestHeader("Accept","application/json");
	    	    },
	           type: "POST",
	           url: "http://localhost:1337/user/create",
	           dataType: "json",

	           success: function (msg) {
	               if (msg) {
	                   alert("User created Succesfully !!"+JSON.stringify(msg));
										window.location.href = "/signin";

	               } else {
	                   alert("Cannot created !"+JSON.stringify(msg));
	               }
	           },
						  error: function(XMLHttpRequest, textStatus, errorThrown) {
						     alert(textStatus+"  some error  "+errorThrown);
						  }



						 ,

	           data: JSON.stringify(sendInfo)
	       });

}
