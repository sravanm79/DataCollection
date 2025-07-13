/*
*   This script has been generated for the project titled
*   "SPEECH TO SPEECH TRANSLATION SYSTEM FOR TRIBAL LANGUAGES"
*   The original author of the script is
*   Swapnil S Sontakke, Project Associate, IIIT, Dharwad
*   Year: February, 2022
*   Version: 2
*/

/*  This file allows a navbar to be sticky when scrolled.
*   This is useful when the page length(height) is long.
*   So that the user can see the navbar from even bottom of
*   the web page.
*/
document.addEventListener('DOMContentLoaded', function()
{
  // When the event DOMContentLoaded occurs, it is safe to access the DOM
  // When the user scrolls the page, execute myFunction 
  window.addEventListener('scroll', myFunctionForSticky);

  // Get the navbar
  var navbar = document.getElementById("navbar");

  // Get the offset position of the navbar
  var sticky = navbar.offsetTop;

  // Add the sticky class to the navbar when you reach its scroll position. 
  // Remove "sticky" when you leave the scroll position

  function myFunctionForSticky()
  {
    /*if (window.pageYOffset >= sticky) {
      console.log("window.pageYOffset >= sticky");
    } else {
      console.log("Not window.pageYOffset >= sticky");
    }*/
    if (window.pageYOffset >= sticky) {
      navbar.classList.add("stickyNav");
    } else {
      navbar.classList.remove("stickyNav");
    }
  }
})



// // Get the navbar
// var myNav = document.getElementById("navbar");
// // Get the offset position of the navbar
// var sticky = myNav.offsetTop;
// // Add the sticky class to the navbar when you reach its scroll position. Remove "sticky" when you leave the scroll position
// function myNavbar() {
//   if (window.pageYOffset >= sticky) {
//     myNav.classList.add("stickyNav")
//   } else {
//     myNav.classList.remove("stickyNav");
//   }
// }
// window.onscroll = function() {myNavbar()};