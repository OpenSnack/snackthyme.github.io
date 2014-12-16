$(function() {
    $('a[href*=#]:not([href=#])').click(function() {
        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
            if (target.length) {
                $('html,body').animate({
                scrollTop: target.offset().top - 50
                }, 350);
                return false;
            }
        }
    });
});

$(window).scroll(function() {
  var scroll = $(window).scrollTop();
    var about_location = $("#about").position();
    var projects_location = $("#projects").position();
    var header_bottom = $("#home").height();
    var just_changed = 0;

    if (scroll < about_location.top - 50) {
      document.getElementById("abt").style.color = "white";
        document.getElementById("hme").style.color = "#20B2AA";
    } else if (scroll > about_location.top - 50 && scroll < projects_location.top - 50) {
      document.getElementById("abt").style.color = "#20B2AA";
        document.getElementById("hme").style.color = "white";
        document.getElementById("prj").style.color = "white";
    } else if (scroll > projects_location.top - 50){
        document.getElementById("abt").style.color = "white";
        document.getElementById("prj").style.color = "#20B2AA";
    }

    if (scroll > header_bottom) {
        //document.getElementById("nav").style.display = "block";
        $("#nav").slideDown(200);
    } else if (scroll < header_bottom) {
        //document.getElementById("nav").style.display = "none";
        $("#nav").slideUp(200);
    }
});