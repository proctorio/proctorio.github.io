# Proctorio Open Source 
## Make Proctorio Integrations Even Better
![proctorio logo](http://cdn.proctorio.net/guides/images/proctorio_logo_and_text_color_on_white_bkg.png)

Gone are the days of broken exams and test taker access codes. This open source script makes our seamless learning management system integration even stronger by preventing two of the biggest pain points. Once enabled, test authors will not be able to edit Proctorio tests and test takers cannot attempt to begin a test without the correct browser extension installed. Help us make Proctorio smarter and reduce headaches by installing this simple one line of code!

## Why Open Source?
At Proctorio, we have the utmost respect for security and privacy. We chose to make our javascript open source to protect your information and ensure that you remain in complete control. Thanks to this transparent approach, you can implement our small change without surrendering access or manipulating critical learning management system code. You have the choice to use the minified or full version and the files are served directly from GitHub for extra trust and security. 

![github gif](http://cdn.proctorio.net/guides/images/Global-JavaScript-GitHub-GIF.gif)

## Key Features
* Simple integration into your institution’s learning management system.
* Prevents Proctorio tests from being edited outside of a browser without the Proctorio extension.
* Prevents test takers from accessing Proctorio exams without the Proctorio browser extension installed.
# How to Install - Canvas

## 1. Download File
> We recommend using our CDN URL (cdn.proctorio.net) to serve the file as opposed to the GitHub raw URL (raw.githubusercontent.com). When our monitoring systems detect the GitHub CDN (Fastly) is down or its performance is degraded, we will automatically switch to a backup CDN served by Verizon EdgeCast to guarantee uptime and speed. The GitHub raw version is provided below, but is not recommended. 
   * Click [here](https://raw.githubusercontent.com/proctorio/proctorio.github.io/master/snippets/canvas_global_minified.js) and right click "Save as..." to download the file. This version will guarantee up-time **(recommended)**. 
   * _To use the raw **(not recommended)** version, served directly from GitHub use this [link](https://raw.githubusercontent.com/proctorio/proctorio.github.io/master/snippets/canvas_global_raw_minified.js) instead._

## 2. Open Account
![Admin picture](http://cdn.proctorio.net/guides/images/Admin.png)
 * While logged into LMS as an administrator, click Admin on the navigation bar, then select the account name.
 ## 3. Open Themes
 ![theme](http://cdn.proctorio.net/guides/images/Theme.png)
   * Select Themes in the Account Navigation

>Note: If sub-account themes have been enabled, each sub-account also includes a Themes link. To open the Theme Editor for a sub-account, click the Sub-Accounts link to locate and open the sub-account, then click the sub-account's Themes link.
## 4. Open Theme Template
![Open Theme](http://cdn.proctorio.net/guides/images/OpenTheme.png)

   * Hover over the name of your active theme and select Open in Theme Editor.

## 5. Upload Custom Files
![Upload](http://cdn.proctorio.net/guides/images/Upload.png)
* Once in the Theme Editor, select the Upload tab. 
* Locate fields for CSS/Javascript files for the Canvas desktop application.

![Javascript](http://cdn.proctorio.net/guides/images/javascript.png)

* Click Select under JavaScript file and locate the file on your computer.

![Select File](http://cdn.proctorio.net/guides/images/SelectJavaScript.png)

> Note: If a file is already in place, combine the existing file with the Proctorio file in a text editor and re-upload to the Javascript section. You can also simply add this line to your existing javascript file:

```javascript
(function(){var a=document.createElement("script"),b=document.head||document.getElementsByTagName("head")[0];a.onload=function(){b.removeChild(a)};a.src="//cdn.proctorio.net/snippets/gbl/canvas-global-embed.min.js";b.appendChild(a)})();
```

## 6. Save Theme 
![Save](http://cdn.proctorio.net/guides/images/Save.png)
   * If working off of a template, enter a name to save as a new theme.
   * If you edited a previously saved theme, saving the theme overwrites the previous version of the theme and uses the same theme name.

## 7. Apply Theme

![apply](http://cdn.proctorio.net/guides/images/applytheme.png)

* To apply your theme to your account, click the "Apply theme" button.

## 8. Test 


   * Create a test quiz to ensure all changes were applied properly. 
   * We suggest attempting to edit the quiz in another browser and trying to access the exam as a student without the extension installed.
   
## Before

![Before](http://cdn.proctorio.net/guides/images/BeforeJS.png)

## After

![After](http://cdn.proctorio.net/guides/images/AfterJS.png)

# Support

Need help with anything above? We’ve got your back! You can reach us at support@proctorio.com or by contacting your Partner Success Manager directly. 


