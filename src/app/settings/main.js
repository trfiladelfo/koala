/**
 * settings window
 */

'use strict';

var path = require('path'),
	fs   = require('fs');

//Add error event listener
var errorLog = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.koala/error.log'; 
window.addEventListener('error', function (err) {
	var message = '---error---\n' + err.filename + ':' + err.lineno + '\n' + err.message + '\n\n';
	fs.appendFile(errorLog, message);
}, false);

var configManger      = require(process.cwd() + '/app/appConfig.js'),
	appConfig         = configManger.getAppConfig(),
	appPackage        = configManger.getAppPackage(),
	hasChange         = false,
	userConfigFile    = appConfig.userConfigFile,
	userConfigContent = fs.readFileSync(userConfigFile, 'utf8'),
	settings          = JSON.parse(userConfigContent),
	util              = require(process.cwd() + '/app/util.js'),
	il8n              = require(process.cwd() + '/app/il8n.js'),
	gui               = require('nw.gui');

//render page
(function () {
	//distinguish between different platforms
	$('body').addClass(process.platform);

	//less
	if (settings.less.compress) $('#less_outputStyle').find('[name=compress]')[0].selected = true;
	if (settings.less.yuicompress) $('#less_outputStyle').find('[name=yuicompress]')[0].selected = true;
	if (!settings.less.compress && !settings.less.yuicompress) $('#less_outputStyle').find('[name=normal]')[0].selected = true;
	$('#less_lineComments')[0].checked = settings.less.lineComments;
	$('#less_debugInfo')[0].checked = settings.less.debugInfo;

	//sass
	$('#sass_outputStyle').find('[name='+ settings.sass.outputStyle +']')[0].selected = true;
	$('#sass_compass')[0].checked = settings.sass.compass;
	$('#sass_lineComments')[0].checked = settings.sass.lineComments;
	$('#sass_unixNewlines')[0].checked = settings.sass.unixNewlines;
	$('#sass_debugInfo')[0].checked = settings.sass.debugInfo;

	//coffeescript
	$('#coffee_bare')[0].checked = settings.coffeescript.bare;
	$('#coffee_lint')[0].checked = settings.coffeescript.lint;

	//use system command
	$('#systemcommand_less')[0].checked = settings.systemCommand.less;
	$('#systemcommand_sass')[0].checked = settings.systemCommand.sass;
	$('#systemcommand_coffeescript')[0].checked = settings.systemCommand.coffeescript;


	//locales
	$('#locales').find('[name='+ settings.locales +']')[0].selected = true;

	//minimize to tray
	$('#minimizeToTray')[0].checked = settings.minimizeToTray;

	//minimize on startup
	$('#minimizeOnStartup')[0].checked = settings.minimizeOnStartup;
	
	//filter
	$('#filter').val(settings.filter.join());

	//about
	var maintainers = appPackage.maintainers;
	$('#link_project').html(maintainers.project).attr('href', maintainers.project);
	$('#link_issues').html(maintainers.issues).attr('href', maintainers.issues);
	$('#koalaVersion').html(appPackage.version);
	$('#lessVersion').html(appPackage.appinfo.less);
	$('#sassVersion').html(appPackage.appinfo.sass);
	$('#compassVersion').html(appPackage.appinfo.compass);
	$('#coffeeVersion').html(appPackage.appinfo.coffeescript);

	//open external link
	$(document).on('click', '.externalLink', function () {
		gui.Shell.openExternal($(this).attr('href'));
		return false;
	});
})();

//set less output style
$('#less_outputStyle').change(function () {
	var val = $(this).val();
	if (val === '') {
		settings.less.compress = false;
		settings.less.yuicompress = false;
	} 
	if (val === 'compress') {
		settings.less.compress = true;
		settings.less.yuicompress = false;
	}
	if (val === 'yuicompress') {
		settings.less.compress = false;
		settings.less.yuicompress = true;
	}
	hasChange = true;
});

//set sass compile options
$('#sass_outputStyle').change(function () {
	settings.sass.outputStyle = $(this).val();
	hasChange = true;
});

//set  compass,lineComments,unixNewlines,debugInfo,lint,bare
$('#less_options, #sass_options, #coffee_options').find('input[type=checkbox]').change(function () {
	var name = this.name,
		rel  = $(this).data('rel');
	settings[rel][name] = this.checked;
	hasChange = true;
});

//set use system command enable
$('#systemcommand_options').find('input[type=checkbox]').change(function () {
	var id = $(this).attr('id'),
		rel = id.replace('systemcommand_', '');

	settings.systemCommand[rel] = this.checked;
	hasChange = true;
})

//set filter
$('#filter').keyup(function () {
	if ($(this).val() !== settings.filter.join()) hasChange = true;
})

//set locales
$('#locales').change(function () {
	settings.locales = this.value;
	hasChange = true;
});

//set minimize action
$('#minimizeToTray, #minimizeOnStartup').change(function () {
	settings[this.id] = this.checked;
	hasChange = true;
});

//Check Upgrade
function checkUpgrade () {
	$('#upgradeloading').show();

	var url = appPackage.maintainers.upgrade,
		currentVersion = appPackage.version;

	util.checkUpgrade(url, currentVersion, function (data, hasNewVersion) {
		if (hasNewVersion) {
			$('#newVersion').html(data.version);
			$('#upgradetips .update').show();
			$('#link_download').attr('href', data.download[appConfig.locales]);
		} else {
			$('#upgradetips .noupdate').show();
		}
		
	}, {
		success: function () {
			$('#upgradeloading').hide();
		},
		fail: function () {
			$('#upgradeloading').hide();
			alert(il8n.__('Network requests failed, please try again'));
		}
	});
}

$('#checkupgrade').click(checkUpgrade);

//save settings
var win = require('nw.gui').Window.get();
$('#ok').click(function () {
	saveSettings();
	win.close();
});

//close window
$('#cancel').click(function () {
	win.close();
});
$(document).keydown(function (e) {
	if (e.which === 27) {
		win.close();
	}
});

win.on('close', function () {
	global.settingsWindow = null;
	this.close(true);
});

function saveSettings () {
	if (hasChange) {
		var filterString = $('#filter').val().trim();
		if (!filterString) {
			settings.filter = []
		} else {
			settings.filter = filterString.split(',');
		}

		fs.writeFileSync(userConfigFile, JSON.stringify(settings, null, '\t'));

		//effective immediately
		delete settings.locales;
		for (var k in settings) {
			appConfig[k] = settings[k];
		}
	}
}
