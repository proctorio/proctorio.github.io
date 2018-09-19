 /*
    CANVAS GLOBAL EMBED SCRIPT

    CONCEPTS:
        - this script will run when the extension is not running
        - the extension will block this script from running
        - we want to block professors from editing and moderating quizzes as well as getting the password
        - we want to block students from seeing the access code page
        - we want to give students the ability to take an exam if it has been set up with ACL and they have the access code

        - internationalization (i18n)
            - the messages are contained in a separate json file
            - english is kept as default, in case we can't load the script
            - the messages are added using a "JSONP" equivalent
                - add the script to the head, then execute the magic guid function
                - the magic guid is: bf198edd2ffc40369ed4fa86482bba9c
*/

(function()
{
    // hold reference to the "drip"
    // this is a css file that hides things that we don't want to have shown
    var global_embed_drip = null;

    // our helper functions and polyfills
    var helpers = {};

    // i18n messages, default with english
    var messages = {
        'cr': 'Google Chrome is required for this quiz',
        'er': 'An extension is required for this quiz',
        'twp': 'Take with Proctorio',
        'rwp': 'Resume with Proctorio',
        'twtc': 'Take at Testing Center',
        'rwtc': 'Resume at Testing Center',
        'or': 'or',
        'lor': 'If you do not have an access code and are not at a testing center, you can take the exam using Proctorio.',
        'isi': 'Invalid Setup. Contact your instructor'
    };

    // check to see if this is high density, this will change out the 
    var is_high_density = false;

    // get the language of the user, this will default to english
    var browser_language = 'en';

    // set the title embed, this is an array
    // for both remotely proctored and lockdown only
    var title_embed = ['(Remotely Proctored)', '(Secure Browser)'];

    // set the get page url
    var get_page_url = 'https://getproctorio.com';

    // define helper functions
    var proctorio_helpers =
    {
        /*
            get the document head, ie8 does not have document.head
            @returns: HTMLElement           => the head element
        */
        'get_head': function()
        {
            return document.head || document.getElementsByTagName('head')[0];
        },

        /*
            polyfill "endsWith" for older browsers/non-chrome browsers
            @param: subjectString       => the string to search within (haystack)
            @param: searchString        => the string we are looking for (needle)
            @param: endPosition         => (OPTIONAL) to be supplied if we are looking for the string in a specific spot
            @returns: bool              => whether or not the string ends with what we are searching for
        */
        'endsWith': function(subjectString, searchString, endPosition)
        {
            // check to see if the browser is pre-packaged with endswith
            if (!String.prototype.endsWith)
            {
                // we need to polyfill
                if (typeof endPosition !== 'number' || !isFinite(endPosition) || Math.floor(endPosition) !== endPosition || endPosition > subjectString.length)
                {
                    endPosition = subjectString.length;
                }
                endPosition -= searchString.length;
                var lastIndex = subjectString.indexOf(searchString, endPosition);
                return lastIndex !== -1 && lastIndex === endPosition;
            }
            else
            {
                // we have the prototype built in the browser
                // we will use this
                return subjectString.endsWith(searchString, endPosition);
            }
        },

        /*
            function to detect if we are using chrome or not
        */
        'is_chrome': function()
        {
            // check that chrome is populated, that we aren't edge, and that we aren't mobile
            return (window.chrome && (/Chrome/i.test(window.navigator.userAgent) && window.navigator.userAgent.indexOf("Edge") === -1) && !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(window.navigator.userAgent)));
        },

        /*
            build the image url, we have two states
                1. no chrome
                2. no proctorio
            also need to figure out if we are in a high density display or not

            @returns: string            => the url of the image to display from the CDN
        */
        'get_img_url': function()
        {
            /*
                function to detect if we are in a high density display or not
                @retuns: bool               => true if high density (retina), false if regular
            */
            var is_high_density = function()
            {
                // taken from retina.js
                // https://github.com/imulus/retinajs

                // check the device pixel ratio first
                if (window.devicePixelRatio > 1)
                    return true;

                // build a media query
                var mediaQuery = '(-webkit-min-device-pixel-ratio: 1.5), (min--moz-device-pixel-ratio: 1.5), (-o-min-device-pixel-ratio: 3/2), (min-resolution: 1.5dppx)';

                // check to see if we match the media query
                if (window.matchMedia && window.matchMedia(mediaQuery).matches)
                    return true;

                // not high density
                return false;
            };

            // build and return the url for the image that we should show
            // we need chrome or the extension
            // we are running high density or regular
            return '//az545770.vo.msecnd.net/img/1/' + browser_language + '/' + (helpers.check_for_lti() ? (helpers.is_chrome() ? 'er' : 'cr') : 'isi') + (is_high_density() ? '@2x' : '') + '.gif';
        },

        /*
            polyfill to set textContent, ie8 and lower
            @param: dom             => dom to change out the text of
            @param: text            => the text to set
        */
        'setTextContent': function(dom, text)
        {
            try
            {
                // start with text content
                dom.textContent = text;
            }
            catch (e)
            {
                try
                {
                    // if we don't have text content, we should have inner text
                    dom.innerText = text;
                }
                catch (e) { }
            }
        },

        /*
            polyfill to get text content, ie8 and lower
            @param: dom             => dom to change out the text of
            @returns: String        => the textContent
        */
        'getTextContent': function(dom)
        {
            try
            {
                // start with text content
                return dom.textContent;
            }
            catch (e)
            {
                try
                {
                    // if we don't have text content, we should have inner text
                    return dom.innerText;
                }
                catch (e)
                {
                    return null;
                }
            }
        },

        /*
            check to see if this person is an instructor
            we will default to true, since the instructor is more restrictive currently
            @returns: bool          => true if instructor (or not enough info), false if student role is verified
        */
        'is_instructor': function()
        {
            // need to check to see if we have the "student" role within our roles list
            if (!window.ENV.current_user_roles || !window.ENV.current_user_roles.length)
                return true;

            // check to see if we have the admin role
            // admin roles will have multiple roles within this user roles array
            // which will include student
            // if they are an admin, then we will consider them to be an instructor
            if (window.ENV.current_user_roles.indexOf('admin') > -1)
                return true;

            // we have roles, check to see if one is student
            for (var i = 0; i < window.ENV.current_user_roles.length; i++)
            {
                // check for "student"
                if (window.ENV.current_user_roles[i] == 'student')
                    return false;
            }

            // we are an instructor
            return true;
        },

        /*
            check to see if this exam is flexible or an ACL quiz
        */
        'is_access_controlled': function()
        {
            // check to see if we are access controlled
            return (window.ENV.QUIZ.description && window.ENV.QUIZ.description.indexOf && window.ENV.QUIZ.description.indexOf('proctoriocontrol') > -1);
        },

        /*
            use the ENV variable to determine if a quiz is proctorio or not
        */
        'is_proctorio_env': function()
        {
            // make sure that we have the ENV
            if (!window.ENV || !window.ENV.QUIZ || !window.ENV.QUIZ.title || !window.ENV.QUIZ.title.indexOf)
                return false;

            // iterate over all the title embeds
            for (var i = 0; i < title_embed.length; i++)
            {
                // check to see if this title embed is in the title
                if (window.ENV.QUIZ.title.indexOf(title_embed[i]) > -1)
                    return true;
            }

            // it's not in the title
            return false;
        },

        /*
            function to get the i18n messages for the embeds
            @param: callback        => function to run when we have a language pack
        */
        'get_language_pack': function(callback)
        {
            // get the language of the browser currently
            // fall back to english if we can't find it or have an error
            try
            {
                // use polyfill to get the language
                var language = window.navigator.userLanguage || window.navigator.language;

                // we have the language, if there is a dash, we want to use what's to the left of it
                if (language.indexOf('-') > -1)
                {
                    // we have a dash, get the first element in the split
                    language = language.split('-')[0];
                }

                // check for lo dash
                if (language.indexOf('_') > -1)
                {
                    // we have a lo dash, get the first element in the split
                    language = language.split('_')[0];
                }

                // check to see if this is a supported language
                // otherwise, default to english
                // TODO: fill in other languages
                var supported_languages = ['en'];

                // check to see if this language exists in the supported languages array
                if (supported_languages.indexOf(language) > -1)
                {
                    // this is a language that we support!
                    browser_language = language;
                }
                else
                {
                    // we don't know this language
                    // fallback to english
                    browser_language = 'en';
                }
            }
            catch (e)
            {
                // something has gone wrong
                // couldn't figure it out, default to english
                browser_language = 'en';
            }
            
            // if we are english, then this will already be a part of the file
            // and we can fire the callback without requesting info from the CDN
            if (browser_language == 'en')
            {
                // no need to request
                callback();
                return;
            }

            // get the language pack
            // we simulate JSONP with this
            var language_pack_script = document.createElement('script');

            // handle a 5 second timeout
            var is_timeout = false;
            var on_timeout = setTimeout(function()
            {
                // set the flag that we have timed out
                is_timeout = true;

                // remove the script
                language_pack_script.parentNode.removeChild(language_pack_script);

                // fire the callback, we will fallback to english
                callback();

            }, 5000);

            // make sure that we handle any timeouts
            language_pack_script.onerror = function()
            {
                // clear the timeout for timeouts
                clearTimeout(on_timeout);

                // if we have timed out, then we're done
                if (is_timeout)
                    return;

                // remove the script
                language_pack_script.parentNode.removeChild(language_pack_script);

                // an error occurred, fallback to en
                callback();
            };

            // when the script loads, we want to fire the secret guid function
            language_pack_script.onload = function()
            {
                // clear the timeout for timeouts
                clearTimeout(on_timeout);

                // if we have timed out, then we're done
                if (is_timeout)
                    return;

                // the script has loaded!                

                // make sure that we have the secret guid, if we do
                // then we have a new set of messages, otherwise we will keep our english messages
                if (typeof window.bf198edd2ffc40369ed4fa86482bba9c == 'function')
                    messages = window.bf198edd2ffc40369ed4fa86482bba9c();

                // remove the script
                language_pack_script.parentNode.removeChild(language_pack_script);

                // fire the callback
                callback();
            };

            // set the src for the language pack
            language_pack_script.src = '//az545770.vo.msecnd.net/snippets/1/' + browser_language + '/canvas-global-messages.js';

            // add the script to the head
            helpers.get_head().appendChild(language_pack_script);
        },
        
        /*
            check to see if the LTI is in this course
            @returns: bool          => flag, whether or not the LTI is in the course
        */
        'check_for_lti': function()
        {
            // get the left hand navigation
            var left_nav = document.getElementById('section-tabs');

            // couldn't find it...
            if (!left_nav)
                return false;

            // get the anchors within the left hand navigation
            var left_nav_anchors = left_nav.getElementsByTagName('a');
            for (var i = 0, ilen = left_nav_anchors.length; i < ilen; i++)
            {
                // we definitely need to have an external tool
                if (!left_nav_anchors[i].href || left_nav_anchors[i].href.indexOf('/external_tools/') == -1)
                    continue;
                
                // check to see if this is correctly name
                if (left_nav_anchors[i].textContent.indexOf('Secure Exam Proctor') > -1)
                    return true;
            }

            // could not find the LTI
            return false;
        }
    };

    // define page functions

    /*
        the show page, we don't want to allow the instructor to edit
        if we are a student, we can't take the exam without proctorio, unless it is access controlled
    */
    var quiz_show = function()
    {
        // check to see if this is a proctorio exam
        if (helpers.is_proctorio_env())
        {
            // the show page is where you can click the buttons to start the exam
            // for students, they will require chrome if there is no access control
            //  if there is access control, then we can create the two buttons to allow 
            //  the option of having the proctor place the access code in or to use proctorio

            // get the description
            var desc = document.getElementsByClassName('description');

            // make sure that we have the description
            if (desc.length && helpers.is_instructor())
            {
                // description is here, let's make sure that the embed code is showing
                desc[0].style.height = desc[0].scrollHeight + 'px';
            }

            // check to see if we are a student
            if (!helpers.is_instructor())
            {
                // we are a student

                // extract the url
                var url = window.location.href;

                // we need to make sure that we don't go to the "headless" page
                if (window.location.search)
                {
                    // we have something here, it's probably the ?headless=1
                    // we need to get rid of this so we don't have issues again
                    if (window.location.search == '?headless=1')
                        url = window.location.href.replace('?headless=1', '');
                }
                
                // make sure that we are the top frame
                // it's possible that we are within an iframe
                // on the assignments page
                // we could also be in th emain frame but on a headless page
                if (window.top != window.self || url != window.location.href)
                {
                    // we are within an iframe
                    // this code is running on the iframe

                    // this page can be accessed by going to grades and then clicking on the quiz
                    window.top.location = url;

                    // should be redirecting
                    return;
                }

                // build an extra button
                // and if we have the take quiz link on the rhs, we need to add that as well
                var take_quiz_links = [];

                // get all A tags
                var as = document.getElementsByTagName('A');
                for (var i = 0; i < as.length; i++)
                {
                    // verify that this is a take quiz tag
                    if (typeof as[i].href != 'undefined' && as[i].href.indexOf('/take?') != -1)
                        take_quiz_links.push(as[i]);
                }

                // did we have any take quiz buttons?
                // it's possible that this exam has not opened, is closed, or has no attempts left
                // if this is the case and we are accessing it from another browser
                // we don't want it to say proctorio is required
                if (take_quiz_links.length)
                {
                    // check to see if this exam flexible or is proctorio required
                    if (!helpers.is_access_controlled())
                    {
                        // make sure that the LTI is in the course
                        if (helpers.check_for_lti())
                        {
                            // check to see if the embed code is on the page
                            // if it isn't then we need to put it here ourselves
                            // if it is, then the embed can do it's job
                            if (document.getElementsByClassName('proctorio-embed').length)
                                return;

                            // student, no acl need proctorio
                            helpers.get_language_pack(function()
                            {
                                // no embed code, push the embed code in ourselves
                                proctorio_yes(desc.length ? desc[0] : document.getElementById('content'));
                            });
                        }
                        else
                        {
                            // there is no LTI
                            proctorio_no_lti(desc.length ? desc[0] : document.getElementById('content'));
                        }
                    }
                    else
                    {
                        // proctorio maybe
                        // get the language pack to render the correct buttons
                        helpers.get_language_pack(function()
                        {
                            // run this through to make the duplicated buttons/links
                            proctorio_maybe(take_quiz_links);

                            // show the buttons
                            proctorio_no();
                        });
                    }
                }
                else
                {
                    // no take quiz buttons, the student is not allowed to take this exam
                    // if we have the embed code, we'll want to hide the embed code
                    var embed = document.getElementsByClassName('proctorio-embed');

                    // hide the embed codes, if we have any
                    for (var i = 0; i < embed.length; i++)
                        embed[i].style.display = 'none';
                }
            }
            else
            {
                // this is an instructor

                // we still don't want to show the password
                // find the password and hide it
                var control_groups = document.getElementsByClassName('control-group');
                for (var i = 0; i < control_groups.length; i++)
                {
                    // check to see if this contains "Access Code"

                    // get the text
                    var text = helpers.getTextContent(control_groups[i]);

                    // check for an access code
                    if (!text || typeof text.indexOf != 'function' || text.indexOf('Access Code') == -1)
                        continue;

                    // this must have the access code
                    // hide it
                    control_groups[i].style.display = 'none';
                }

                // find the title, inject this after the title
                // if we are proctorio yes or we have no LTI
                var dom = document.getElementById('quiz_title');
                if (dom)
                    dom = dom.nextElementSibling;

                // make sure that we have the LTI
                if (helpers.check_for_lti())
                {
                    // check to see if the embed code is on the page
                    // if it isn't then we need to put it here ourselves
                    // if it is, then the embed can do it's job
                    if (document.getElementsByClassName('proctorio-embed').length)
                        return;

                    // there's no embed code, we should add our embed img
                    helpers.get_language_pack(function()
                    {
                        // need to embed an image
                        proctorio_yes(dom);
                    });
                }
                else
                {
                    // there is no LTI
                    proctorio_no_lti(dom);
                }
            }
        }
        else
        {
            // not a proctorio exam, show
            proctorio_no();
        }
    };

    /*
        the quiz edit page, we are an instructor
        if we are on a proctorio exam, we need to hide the functionality here
    */
    var quiz_edit = function()
    {
        // this is the quiz settings page
        // to be here, we must be an instructor
        if (helpers.is_proctorio_env())
        {
            // hide the password right away
            var password = document.getElementById('enable_quiz_access_code');
            while (password != null && password.parentNode)
            {
                // check to see if we are at the option group
                if (password.classList && password.classList.contains('option-group'))
                    break;
                else
                    password = password.parentNode;
            }

            // hide the password
            if (password)
                password.style.display = 'none';

            // pull down our language pack
            // so we can build the proctorio yes
            helpers.get_language_pack(function()
            {
                // find the dom that we want to display the proctorio embed image in
                var dom = document.getElementById('quiz_options_form');
                if (dom)
                    dom = dom.firstChild;

                // push the embed code in where the dom is
                // this page will not render the extension page
                proctorio_yes(dom);
            });
        }
        else
            proctorio_no();
    };

    /*
        function to run on the quiz take page
        this will prevent instructors and students from seeing the access code page 
    */
    var quiz_take = function()
    {
        // make sure this is a proctorio exam
        if (helpers.is_proctorio_env())
        {
            // figure out what we have here
            // these will find our role and the quiz set-up
            var instructor = helpers.is_instructor();
            var acl = helpers.is_access_controlled();

            // we are on the take page, we could be an instructor or a student
            // if we are a student, we need to check to see if we have the control class
            //  this will allow us to take the exam with an access code
            // if we are an instructor, we might as well stop them here
            if (instructor || !acl)
            {
                // instructor, no access to this page
                // student, no acl need proctorio
                
                // check to see if we have the access code here
                // this will let us know if we are in the exam or on the access code page
                var access_code = document.getElementById('quiz_access_code');
                if (access_code)
                {
                    // we need to show the embed

                    // we have an access code
                    helpers.get_language_pack(function()
                    {
                        // we need to do some work here to get the embed code in
                        // this page is a little limited
                        
                        // initialize a dom, this is what we'll be putting the embed into
                        var dom = null;

                        // start with the form
                        var form = document.getElementsByTagName('form');
                        if (form)
                        {
                            // we have the form, we want to insert a dummy dom on top of it
                            dom = form[0];

                            // use this elem to find th p tag and hide it
                            // the canvas messaging is a little unclear
                            var elem = dom;

                            // find the p tag
                            while (elem != null && elem.tagName != 'P')
                                elem = elem.previousElementSibling;

                            // hide it
                            elem.style.display = 'none';
                        }

                        // insert the embed code
                        proctorio_yes(dom);
                    });
                }
            }
            else
            {
                // we are a student and this is an ACL test or "flexible" test
                // we can let them try to add the password here if they know it

                // check to see if the access code page is here
                // we wouldn't want to hide any buttons within the exam
                if (document.getElementById('quiz_access_code'))
                {
                    // we need to find the submit access code button
                    // there should be just one button located within a single form
                    var forms = document.getElementsByTagName('form');
                    for (var i = 0; i < forms.length; i++)
                    {
                        // get the button to submit the access code
                        var buttons = forms[i].getElementsByTagName('button');
                        if (!buttons.length)
                            continue;

                        // we have the button, send it to proctorio maybe
                        helpers.get_language_pack(function()
                        {
                            // create an array that contains the button
                            proctorio_maybe([buttons[0]]);
                        });

                        // done here
                        break;
                    }
                }

                // if we are here, then we had a problem finding the button on the take page
                // we will force them to use proctorio
                proctorio_no();               
            }

            // we could already be in the exam
            // we will want to hide the proctorio embed code
            var embed = document.getElementsByClassName('proctorio-embed');
            if (embed.length)
                embed[0].style.display = 'none';
        }
        else
        {
            // not a proctorio exam
            proctorio_no();
        }
    };

    /*
        function to run when the instructor is on the moderate page
    */
    var quiz_moderate = function()
    {
        // get the breadcrumbs
        var breadcrumbs = document.getElementById('breadcrumbs');

        // verify that we have the breadcrumbs
        if (!breadcrumbs)
        {
            // couldn't get the breadcrumbs, can't validate
            // whether or not this is proctorio
            proctorio_no();
            return;
        }

        // we have breadcrumbs, check to see if we have a breadcrumb
        // that contains the title embed
        var crumbs = breadcrumbs.getElementsByTagName('LI');
        for (var i = 0; i < crumbs.length; i++)
        {
            // get the text content from this breadcrumb
            var text_content = helpers.getTextContent(crumbs[i]);

            // make sure that we got something
            if (!text_content || typeof text_content.indexOf != 'function')
                continue;

            // iterate on our title embeds to see if one of them is there
            for (var j = 0; j < title_embed.length; j++)
            {
                // check to see if this contains the title embed
                if (text_content.indexOf(title_embed[j]) > -1)
                {
                    // we require proctorio to edit this page
                    helpers.get_language_pack(function()
                    {
                        // overwrite the student table, we can't have the prof going through
                        // to update times or whatever without extension control
                        proctorio_yes(document.getElementById('students'));
                    });

                    // we are running our script to overwrite the page functionality
                    // don't need to continue
                    return;
                }
            }
        }

        // proctorio could not be found on this quiz
        proctorio_no();
    };

    /*
        function that will determine where we are to perform the necessary page actions
        if required
    */
    var url_detection = function()
    {
        // make sure that we can do this
        if (!window.location || !window.location.pathname)
        {
            // no way of identifying where we are
            proctorio_no();
            return;
        }

        // get the pathname
        var pathname = window.location.pathname;

        // make sure that we got a string, we need to have our prototype functions
        if (typeof pathname.indexOf == 'undefined')
        {
            // don't know what to do
            proctorio_no();
            return;
        }

        // url detection
        if (pathname.indexOf('/quizzes/') > -1 && helpers.endsWith(pathname, '/edit'))
        {
            // the edit quiz page, we can't let the instructor do anything here
            quiz_edit();
        }
        else if (pathname.indexOf('/quizzes/') > -1 && helpers.endsWith(pathname, '/moderate'))
        {
            // moderate page, we are an instructor
            // but we dont have the ENV.QUIZ variable
            quiz_moderate();
        }
        else if (pathname.indexOf('/quizzes/') > -1 && pathname.indexOf('/take') > -1)
        {
            // this is the access code page
            quiz_take();
        }
        else if (pathname.indexOf('/quizzes/') > -1)
        {
            // this is the show page
            quiz_show();
        }
        else
        {
            // not a page we care about
            proctorio_no();
        }
    };

    // define proctorio ui modification functions

    /*
        function to add the proctorio embed image to the current page
        this will tell the person they need to go and get the chrome extension
        @param: dom         => the dom to put the embed image within
    */
    var proctorio_yes = function(dom)
    {
        // show our copy of the embed code
        // we don't necessarily know that it will be here
        if (!dom)
        {
            // couldn't get the content, that's ok
            return;
        }

        // hold the short message
        var short_message = helpers.check_for_lti() ? (helpers.is_chrome() ? 'er' : 'cr') : 'isi';

        // we have the page content
        // and then push in our quiz embed code
        dom.style.display = 'none';

        // we are on a proctorio exam, but we're not set up
        // we want to send the person to the get page
        var a = document.createElement('a');
        a.target = '_blank';
        a.href = (helpers.check_for_lti()) ? get_page_url : '#';
        a.title = messages[short_message];

        // create the image
        var img = document.createElement('img');
        img.style.border = 0;
        img.alt = messages[short_message];

        // if the image loads, then let's add it to the dom
        img.onload = function()
        {
            // we successfully loaded the image
            // add the img to the a tag
            a.appendChild(img);

            // insert it before the dom supplied
            dom.parentNode.insertBefore(a, dom);
        };

        // if there is an error, we will need to display something
        img.onerror = function()
        {
            // we'll make a new dom
            var p = document.createElement('p');

            // fill in the text
            p.innerHTML = messages[short_message] + '&nbsp;';

            // add the anchor to our p tag
            a.appendChild(p);

            // append the dom
            dom.parentNode.insertBefore(a, dom);
        };

        // set the src, two things we need to 
        img.src = helpers.get_img_url();
    };

    /*
        function to create two buttons for a student
        this will allow them to use proctorio
        or to have their proctor enter the access code

        @param: doms         => the button(s) to clone
                                should be sent in as an array, not a live HTMLNodeCollection
    */
    var proctorio_maybe = function(doms)
    {
        // make sure that we have doms
        for (var i = 0; i < doms.length; i++)
        {
            // closure this off, keep reference to dom in this scope
            (function(dom)
            {
                // make sure this dom is real
                if (!dom || typeof dom.cloneNode == 'undefined')
                    return;

                // is this a resume or a take
                var text_content = helpers.getTextContent(dom);
                var is_resume = (text_content && typeof text_content.indexOf == 'function' && text_content.indexOf('Resume Quiz') != -1);

                // clone the node
                var proctorio_button = dom.cloneNode(true);

                // check to see if the node is an a tag or if it is a button
                // if we have a button, this is no good
                // since we will have to post to the form, which we don't want to do
                // we would rather open the get page in a new window
                if (proctorio_button.tagName != 'A')
                {
                    // we want an a tag here, but still retain some of the styling
                    proctorio_button = document.createElement('a');
                    proctorio_button.className = dom.className;

                    // set what to do with this tag on click
                    proctorio_button.href = get_page_url;
                    proctorio_button.target = '_blank';
                }

                // change out the text on the proctorio button
                proctorio_helpers.setTextContent(proctorio_button, messages[is_resume ? 'rwp' : 'twp']);

                // attach the proctorio button at the end of this dom
                dom.parentNode.insertBefore(proctorio_button, null);

                // check for show page vs access code page
                if (dom.tagName == 'A')
                {
                    // show page

                    // the take button dom is an a tag on the show page
                    // modify it, no ID, no data need it to open to the get proctorio page
                    proctorio_button.removeAttribute('id');
                    proctorio_button.removeAttribute('data-method');

                    // this is the show page, change out the href and make this a target blank
                    proctorio_button.target = '_blank';
                    proctorio_button.href = get_page_url;

                    // push this button to the left
                    proctorio_button.style.marginLeft = "30px";

                    // change out the text on the canvas button
                    proctorio_helpers.setTextContent(dom, messages[is_resume ? 'rwtc' : 'twtc']);

                    // hide the embed code, the extension might not be required here
                    var embed_code = document.getElementsByClassName('proctorio-embed');
                    if (embed_code.length)
                        embed_code[0].style.display = 'none';
                }
                else
                {
                    // access code page

                    // the canvas messaging wants to have the a proctor type in the password
                    // we will want the UI to provide the option for the student to take the exam
                    // using proctorio if they do not already have an access code

                    var proctorio_messaging_div = document.createElement('div');

                    // first line is an OR
                    var proctorio_or = document.createElement('p');
                    proctorio_or.style.fontSize = '18px';
                    helpers.setTextContent(proctorio_or, messages['or']);

                    // second line is our long message
                    var proctorio_long_message = document.createElement('p');
                    helpers.setTextContent(proctorio_long_message, messages['lor']);

                    // build the messaging div
                    proctorio_messaging_div.appendChild(proctorio_or);
                    proctorio_messaging_div.appendChild(proctorio_long_message);

                    // this goes before the proctorio button
                    proctorio_button.parentNode.insertBefore(proctorio_messaging_div, proctorio_button);
                }
            })(doms[i]);
        }
    };

    /*
        function to undo our style changes
    */
    var proctorio_no = function()
    {
        // to reverse our "drips"
        // we just need to remove our stylesheet

        // make sure it is here first
        if (global_embed_drip)
            global_embed_drip.parentNode.removeChild(global_embed_drip);
    };

    /*
        this is a proctorio exam, but we don't have the LTI
        added to the course
        @param: dom         => the dom 
    */
    var proctorio_no_lti = function(dom)
    {
        // check to see if the embed code is here or not
        var embed = document.getElementsByClassName('description');
        if (embed.length)
        {
            // we have the embed, so let's check it
            var iframes = embed[0].getElementsByTagName('iframe');

            // make sure we have iframes
            if (iframes.length)
            {
                // iterate, we wouldn't want to mess up an iframe that the instructor
                // has added to their description
                for (var i = 0, ilen = iframes.length; i < ilen; i++)
                {
                    // make sure this is ours
                    if (!iframes[i].src || typeof iframes[i].src.indexOf != 'function' || iframes[i].src.indexOf('//az545770.vo.msecnd.net') == -1)
                        continue;

                    // got it!
                    dom = iframes[i];

                    // hide it
                    iframes[i].style.display = 'none';

                    // no need to continue
                    break;
                }
            }
        }

        // try to hide it again
        if (document.getElementsByClassName('proctorio-embed').length)
            document.getElementsByClassName('proctorio-embed')[0].style.display = 'none';

        // send it through the proctorio yes
        proctorio_yes(dom);
    };

    // step 1. intialize the helpers
    helpers = new Object(proctorio_helpers);

    // step 2. attach css to hide things that don't need to be shown
    try
    {
        // get the head
        //  ie8 does not support document.head
        var head = helpers.get_head();

        // create our link tag
        global_embed_drip = document.createElement('link');
        global_embed_drip.rel = 'stylesheet';
        global_embed_drip.href = '//az545770.vo.msecnd.net/snippets/1/gbl/canvas-global-embed.css';

        // attach to the head
        head.appendChild(global_embed_drip);
    }
    catch (e) { }

    // step 3. wait for canvas ENV
    var wait_for_env = setInterval(function()
    {
        // first need to check for the canvas ENV var
        if (!window.ENV)
            return;

        // we have ENV, clear the interval
        clearInterval(wait_for_env);

        // step 4. figure out where we are and do stuff
        url_detection();
    }, 50);

})();
