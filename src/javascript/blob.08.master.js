//////////////////////////////////////////////////

var isso_link = "@@isso-link";

//////////////////////////////////////////////////

// Syntax highlight
hljs.configure({
    tabReplace: '    ',
});
hljs.initHighlighting();

jQuery(function ($) {

    var history = window.History;
    var $ajaxContainer = $("#ajax-container");

    $(document).keydown(function(event){
        if (event.which == "17") {
          ctrlIsPressed = true;
        }
    });

    $(document).keyup(function(){
        ctrlIsPressed = false;
    });

    var ctrlIsPressed = false;

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

    function lightBox() {

        $(".body p img").each(function () {

            var $image = $(this);

            var $parent = $image.parent("a");

            if ($parent.length === 0) {
                var $wrapper = $("<a/>", {
                    "href": $image.attr("src"),
                    "class": "light-box"
                });

                $image.wrap($wrapper);
                $wrapper.fluidbox();
            }
            else {
                $parent.addClass("light-box");
                $parent.fluidbox();
            }
        });


        $(window).resize(); // fixes small images for some reason TODO
    }

    function attachIsso() {
      if(isso_link && $('#isso-thread').size() !== 0) {
        var dsq = document.createElement("script");
        dsq.setAttribute('data-isso', '//' + isso_link);
        dsq.setAttribute('data-isso-vote', "false");
        dsq.async = true;
        dsq.src = "//" + isso_link + "/js/embed.min.js";
        document.getElementsByTagName("head")[0].appendChild(dsq);
      }
    }

    function onStateChanged() {

        var state = history.getState();

        $(".main-container").addClass("going-container").removeClass("main-container");

        // Move user to top of page (mainly for phone users)
        $("html, body").animate({ 'scrollTop': 0 });

        // Fade out to ajax
        $("#main-footer").fadeOut(100);

        var $tempDiv = $("<div/>", {
            id: $ajaxContainer.id
        });

        var animation = $.Deferred();
        var ajax = $.Deferred();

        $(".main-container").addClass("going-container").removeClass("main-container");

        $tempDiv.load(state.url + " #ajax-content", function (response, status) {

            //// Anything happened?
            if (status !== "success" && status !== "notmodified") {

                // Bad happened
                var samesiteError = $(response).find("#ajax-content");

                if (samesiteError.length > 0) {
                    $tempDiv.html(samesiteError);
                } else {
                    $tempDiv.html($("<br>Error? " + status));
                }
            } else {

                // We are removing title info, get it before its gone.
                document.title = $tempDiv.find("#title").text();
                // Syntax highlight
                $tempDiv.find('pre code').each(function(i, block) {
                    hljs.highlightBlock(block);
                });
            }

            Pace.stop();
            ajax.resolve();
        });

        setTimeout(function () {
            animation.resolve();
        }, 200);

        $.when(animation, ajax).then(function () {

            // Unhide
            $("#main-footer").fadeIn(100);
            $ajaxContainer.html($tempDiv.html());

            // Tell everyone of the new page
            $.event.trigger({
                type: "ajax.completed",
                title: $("#title").text(),
                url: state.url
            });

            // Move to top
            var top = 0;
            try {
                top = $(".nav-bar").offset().top;
            } catch (err) {
                // Error
            }
            $("body").animate({
                scrollTop: top //- 120
            }, 400);
        });
    }

    function isExternal(url) {

        if (url.indexOf("mailto:") === 0 || url === "/rss")
            return true;

        var match = url.match(/^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/);

        if (typeof match[1] === "string" && match[1].length > 0 && match[1].toLowerCase() !== location.protocol)
            return true;

        if (typeof match[2] === "string" && match[2].length > 0 && match[2].replace(new RegExp(":(" + { "http:": 80, "https:": 443 }[location.protocol] + ")?$"), "") !== location.host)
            return true;

        return false;
    }

    function doAjaxLink(e) {

        var $this = $(this);

        // Figure out if link can ajax
        if (ctrlIsPressed === true || $this.hasClass("light-box") || isExternal($this.attr("href")) || $this.hasClass("disable-ajax"))
            return true;

        // The link is ajaxible, disable normal action
        e.preventDefault();

        // Then change the state
        var url = $this.attr("href");
        var title = $this.attr("title") || null;

        if (url !== history.getState().url.replace(/\/$/, "")) {

            history.pushState({}, title, url);
        }

        return false;
    }

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
        $("body").on("click", "a", doAjaxLink);

        // The backbone of Ajax
        history.Adapter.bind(window, "statechange", onStateChanged);

        return true;
    }

    function onLoaded() {

        attempt(function () {
            setTimeout(function () {
                $(".flow").removeClass("flow");
            }, (100 * 10));
        });

        attempt(function () {
            attachIsso();
        });

        attempt(function () {
            lightBox();
        });
    }

    setTimeout(function () {
        (function () {

            // Load the javascript for every page
            onLoaded();

            // See if we can enable Ajax'ed requests
            enableAjax();

            // Run the scripts after ajax (ajax looses scripts)
            $(document).on("ajax.completed", onLoaded);
        }());
    }, 0);
});
