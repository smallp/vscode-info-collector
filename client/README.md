# README
## This is the README for the extension "html-info-collector" 

This extension aims to collect the Id, Class and Data info for js.

The extension will collect these info and give a hint when you write js with jquery.

Now as I use VUE instead of native js, I'll not support this extension any more. You can fork it and modify it by yourself.

## Usage
Here is the HTML:
``` HTML
<html>
<body>
    <div id="test"></div>
    <div class="foo"></div>
    <div class="nimei class" data-data=""></div>
<script src="t.js"></script>
</body>
</html>
```
So in this HTML and the linked js, ```t.js```, when you press ```'.``` OR ```".```, it will give a hint of all class, such as cla, class and nimei. It is the same when you press `'#` OR `"#` which indicate the id, and `data('` which indicate the data info.

## Attention:
You must open the HTML first! The extension will not scan the whole workspace when it is active. Instead, it will scan the folder when you open a HTML. 

** Enjoy!**
