﻿//////////////////////////////////////////////////

var disqus_shortname = 'example';

//////////////////////////////////////////////////

jQuery(function ($) {

    var history = window.History;
    var $ajaxContainer = $('#ajax-container');

    (function () {

        // Bring everything in nicely
        $("body").lazyView();

        // See if we can enable Ajax'ed requests
        enableAjax();

        // Load the javascript for every page
        onLoaded();

        // Prevent flashing when scroll bars apear/hide
        $(window).on("resize", sizeForScroll);

        // Run the scripts after ajax (ajax looses scripts)
        $(document).on("ajax.completed", onLoaded);

    }());

    function enableAjax() {

        // Got Ajax?
        if (!history.enabled) {
            console.log("Ajax not supported. :(");
            return false;
        }

        // Progress bar for Ajax
        Pace.start();
        Pace.restart();

        // Make any link Ajax'ible
        $('body').on('click', 'a', doAjaxLink);

        // The backbone of Ajax
        history.Adapter.bind(window, 'statechange', onStateChanged);
    }

    function onLoaded() {

        attempt(function () {
            attachEvents();
        });

        attempt(function () {
            sizeForScroll();
        });

        attempt(function () {
            attachDisqus();
        });

        attempt(function () {
            $('[data-gist-id]').gist();
        });

        attempt(function () {
            $("#ajax-content").lazyView();
        });

        attempt(function () {
            attachLightBox();
        });
    }

    function attempt(func) {
        setTimeout(function () {
            try {
                func();
            }
            catch (err) {
                console.log(err);
            }
        }, 0);
    }

    function attachEvents() {

        $(".hover-parrent").on("mouseenter", function () {

            $(this).addClass("onhover");
        });

        $(".hover-parrent").on("mouseleave", function () {

            $(this).removeClass("onhover");
        });

        $('[data-gist-id]').on("mouseenter", function () {

            $('[data-gist-id]').width($('#ajax-content').width());
        });

        $('[data-gist-id]').on("mouseleave", function () {

            $('[data-gist-id]').width("auto");
        });

        //    $('.hover-parrent').bind('touchstart', function () {
        //
        //        $(this).addClass("onhover");
        //    });

        //        $(window).scroll(function () {
        //
        //            if ($(document).scrollTop() > 50 && false) {
        //
        //                $(".sticky-menu").addClass("menu-small");
        //            } else {
        //
        //                $(".sticky-menu").removeClass("menu-small");
        //            }
        //        });
    }

    function attachDisqus() {

        // Have we already loaded Disqus?
        if ($("#disqus_script").length > 0) {

            // if id is seen, then run the comments reset script

            DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.identifier = $("#page-id").text();
                    this.page.url = history.getState().url;
                }
            });

        } else if ($("#disqus_thread").length > 0 && $("#disqus_script").length == 0) {

            // We have no Disqus scripts loaded, lets fix that

            var disqus_identifier = $("#page-id").text();
            (function () {
                var dsq = document.createElement('script');
                dsq.id = "disqus_script";
                dsq.type = 'text/javascript';
                dsq.async = true;
                dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
                (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
            })();
        }
    }

    function onStateChanged() {

        var state = history.getState();

        // Move user to top of page (mainly for phone users)
        $('html, body').animate({ 'scrollTop': 0 });

        // Fade out to ajax
        $("#main-footer").fadeOut(100);
        $ajaxContainer.fadeOut(100);

        $('#ajax-container').load(state.url + ' #ajax-content', function (response, status, xhr) {

            // Anything happened?
            if (status != "success" && status != "notmodified") {

                //                var msg = $('<div>', { html: response });
                //                msg = msg.find('#ajax-content').html();
                //
                //                $("#ajax-container").html(msg);

                // Bad happened
                $("#ajax-container").html("<br>Error? " + status);
            }

            // We are removing title info, get it before its gone.
            document.title = $("#title").text();

            // Unhide
            $ajaxContainer.fadeIn(0);
            $("#main-footer").fadeIn(0, function () {
                Pace.stop();
            });

            // Move to top
            $('html, body').animate({
                scrollTop: $("#ajax-content").offset().top - 90
            }, 400);

            // Tell everyone of the new page
            $.event.trigger({
                type: "ajax.completed",
                title: $("#title").text(),
                url: state.url
            });
        });
    }

    function doAjaxLink(e) {

        // Figure out if link can ajax
        if (isExternal($(this).attr('href')) || $(this).hasClass('light-box'))
            return true;

        // The link is ajaxible, disable normal action
        e.preventDefault();

        // Then change the state
        var currentState = history.getState();
        var url = $(this).attr('href');
        var title = $(this).attr('title') || null;

        if (url !== currentState.url.replace(/\/$/, "")) {

            history.pushState({}, title, url);
        }
    }

    function attachLightBox() {

        $("img", ".postcontent").wrap(function () {
            return "<div class='light-box-wrapper'></div>";
        });

        $("img", ".postcontent").addClass("light-box");

        $(".light-box-wrapper").click("click", function () {

            if ($(this).hasClass("selected"))
                $(this).removeClass("selected");
            else
                $(this).addClass("selected");
        });
    }

    function sizeForScroll() {

        var bodyWidth = (hasScrollBar()) ? $(window).width() : $(window).width() - getScrollBarWidth();
        $('body').width(bodyWidth);

        $("#nav-bar").width($("#ajax-container").width());
    }

    function hasScrollBar() {

        return $("body")[0].scrollHeight > $("body")[0].clientHeight;
    }

    function getScrollBarWidth() {

        var scrollTester = document.createElement("div");
        scrollTester.className = "scrollbar-measure";
        document.body.appendChild(scrollTester);

        var scrollBarWidth = scrollTester.offsetWidth - scrollTester.clientWidth;
        document.body.removeChild(scrollTester);

        return scrollBarWidth;
    }

    function isExternal(url) {

        if (url.indexOf("mailto:") === 0)
            return true;

        var match = url.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/);

        if (typeof match[1] === "string" && match[1].length > 0 && match[1].toLowerCase() !== location.protocol)
            return true;
        if (typeof match[2] === "string" && match[2].length > 0 && match[2].replace(new RegExp(":(" + { "http:": 80, "https:": 443 }[location.protocol] + ")?$"), "") !== location.host)
            return true;
        return false;
    }
});