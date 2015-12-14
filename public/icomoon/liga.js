/* A polyfill for browsers that don't support ligatures. */
/* The script tag referring to this file must be placed before the ending body tag. */

/* To provide support for elements dynamically added, this script adds
   method 'icomoonLiga' to the window object. You can pass element references to this method.
*/
(function () {
	'use strict';
	function supportsProperty(p) {
		var prefixes = ['Webkit', 'Moz', 'O', 'ms'],
			i,
			div = document.createElement('div'),
			ret = p in div.style;
		if (!ret) {
			p = p.charAt(0).toUpperCase() + p.substr(1);
			for (i = 0; i < prefixes.length; i += 1) {
				ret = prefixes[i] + p in div.style;
				if (ret) {
					break;
				}
			}
		}
		return ret;
	}
	var icons;
	if (!supportsProperty('fontFeatureSettings')) {
		icons = {
			'paired-audio': '&#xe909;',
			'paired-call': '&#xe90a;',
			'team-collapsed-view': '&#xe90b;',
			'team-expanded-view': '&#xe90c;',
			'end-call': '&#xe907;',
			'funnel': '&#xe908;',
			'cisco': '&#xe900;',
			'help-outline': '&#xe901;',
			'info-outline': '&#xe902;',
			'rotate-object-ccw': '&#xe903;',
			'rotate-object-cw': '&#xe904;',
			'spark': '&#xe905;',
			'webhook': '&#xe906;',
			'way-nav': '&#xe000;',
			'ac-power': '&#xe001;',
			'account': '&#xe002;',
			'acessibility': '&#xe003;',
			'active-speaker-cross': '&#xe004;',
			'active-speaker': '&#xe005;',
			'activities': '&#xe006;',
			'add-contact': '&#xe007;',
			'add-contain': '&#xe008;',
			'add-outline': '&#xe009;',
			'add': '&#xe00a;',
			'admin': '&#xe00b;',
			'alarm': '&#xe00c;',
			'alerting': '&#xe00d;',
			'analysis': '&#xe00e;',
			'android-home': '&#xe00f;',
			'animation': '&#xe010;',
			'annotation': '&#xe011;',
			'applause': '&#xe012;',
			'application': '&#xe013;',
			'applications': '&#xe014;',
			'arrow-left-tail': '&#xe015;',
			'arrow-right-tail': '&#xe016;',
			'at-contain': '&#xe017;',
			'at': '&#xe018;',
			'attachment': '&#xe019;',
			'audio-broadcast': '&#xe01a;',
			'audio-min': '&#xe01b;',
			'audio-plus': '&#xe01c;',
			'audio-settings': '&#xe01d;',
			'aux-camera': '&#xe01e;',
			'back': '&#xe01f;',
			'backup-data': '&#xe020;',
			'battery': '&#xe021;',
			'bell-cross': '&#xe022;',
			'bell': '&#xe023;',
			'blocked': '&#xe024;',
			'bluetooth-contain-cross': '&#xe025;',
			'bluetooth-contained': '&#xe026;',
			'bluetooth-outline': '&#xe027;',
			'bluetooth': '&#xe028;',
			'bookmark': '&#xe029;',
			'brightness': '&#xe02a;',
			'broadcast-message': '&#xe02b;',
			'broken-image': '&#xe02c;',
			'browser': '&#xe02d;',
			'bug': '&#xe02e;',
			'call-forward-divert': '&#xe02f;',
			'call-handling': '&#xe030;',
			'call-log': '&#xe031;',
			'call-rate': '&#xe032;',
			'callback': '&#xe033;',
			'camera': '&#xe034;',
			'certified': '&#xe035;',
			'chapters': '&#xe036;',
			'charging': '&#xe037;',
			'chats': '&#xe038;',
			'check': '&#xe039;',
			'clock': '&#xe03a;',
			'close-keyboard': '&#xe03b;',
			'cloud': '&#xe03c;',
			'cog': '&#xe03d;',
			'comment': '&#xe03e;',
			'community': '&#xe03f;',
			'compass': '&#xe040;',
			'computer': '&#xe041;',
			'conference': '&#xe042;',
			'contact-card': '&#xe043;',
			'contact': '&#xe044;',
			'create-page': '&#xe045;',
			'data-usage': '&#xe046;',
			'day': '&#xe047;',
			'dc-power': '&#xe048;',
			'default-app': '&#xe049;',
			'delete': '&#xe04a;',
			'desk-phone': '&#xe04b;',
			'diagnostics': '&#xe04c;',
			'dial': '&#xe04d;',
			'directory': '&#xe04e;',
			'disc-not-connected': '&#xe04f;',
			'disc': '&#xe050;',
			'display': '&#xe051;',
			'dms': '&#xe052;',
			'document-camera-cross': '&#xe053;',
			'document-camera': '&#xe054;',
			'document': '&#xe055;',
			'download-contain': '&#xe056;',
			'download': '&#xe057;',
			'draw': '&#xe058;',
			'edit-call': '&#xe059;',
			'edit': '&#xe05a;',
			'email': '&#xe05b;',
			'emoticons': '&#xe05c;',
			'endpoint': '&#xe05d;',
			'eraser': '&#xe05e;',
			'error': '&#xe05f;',
			'ethernet': '&#xe060;',
			'exernal-calendar': '&#xe061;',
			'exit-contain': '&#xe062;',
			'exit-outline': '&#xe063;',
			'exit': '&#xe064;',
			'export': '&#xe065;',
			'extension-mobility': '&#xe066;',
			'fbw': '&#xe067;',
			'feedback-clear': '&#xe068;',
			'feedback-result': '&#xe069;',
			'feedback': '&#xe06a;',
			'ffw': '&#xe06b;',
			'filter': '&#xe06c;',
			'flagged': '&#xe06d;',
			'folder': '&#xe06e;',
			'forced-sign-in': '&#xe06f;',
			'forward-to-mobility': '&#xe070;',
			'fullscreen': '&#xe071;',
			'general-source-cross': '&#xe072;',
			'general-source': '&#xe073;',
			'graph': '&#xe074;',
			'ground': '&#xe075;',
			'group-call': '&#xe076;',
			'headset-cross': '&#xe077;',
			'headset': '&#xe078;',
			'help': '&#xe079;',
			'highlight-line': '&#xe07a;',
			'highlighter-check': '&#xe07b;',
			'highlighter': '&#xe07c;',
			'home': '&#xe07d;',
			'hue': '&#xe07e;',
			'hunt-group': '&#xe07f;',
			'idefix': '&#xe080;',
			'image-contain': '&#xe081;',
			'image': '&#xe082;',
			'import': '&#xe083;',
			'inbox': '&#xe084;',
			'incoming-call': '&#xe085;',
			'info': '&#xe086;',
			'instant-meeting': '&#xe087;',
			'intercom-duplex-connected': '&#xe088;',
			'intercom-whisper': '&#xe089;',
			'intercom': '&#xe08a;',
			'invite': '&#xe08b;',
			'key-expansion-module': '&#xe08c;',
			'keyboard': '&#xe08d;',
			'keywords': '&#xe08e;',
			'language': '&#xe08f;',
			'laser-pointer': '&#xe090;',
			'layout': '&#xe091;',
			'leave-meeting': '&#xe092;',
			'left-arrow': '&#xe093;',
			'lightbulb': '&#xe094;',
			'like': '&#xe095;',
			'line-out-left': '&#xe096;',
			'line-out-right': '&#xe097;',
			'link': '&#xe098;',
			'list-menu': '&#xe099;',
			'list-view': '&#xe09a;',
			'location': '&#xe09b;',
			'lock-contain': '&#xe09c;',
			'lock': '&#xe09d;',
			'locked-speaker': '&#xe09e;',
			'manage-cable': '&#xe09f;',
			'maximize': '&#xe0a0;',
			'media-viewer': '&#xe0a1;',
			'meet-me': '&#xe0a2;',
			'meeting-room': '&#xe0a3;',
			'merge-call': '&#xe0a4;',
			'message': '&#xe0a5;',
			'mic-in': '&#xe0a6;',
			'micro-blog': '&#xe0a7;',
			'microphone': '&#xe0a8;',
			'minimize': '&#xe0a9;',
			'missed-call': '&#xe0aa;',
			'mobile-phone': '&#xe0ab;',
			'mobile-presenter': '&#xe0ac;',
			'month': '&#xe0ad;',
			'more': '&#xe0ae;',
			'move-page': '&#xe0af;',
			'multi-display': '&#xe0b0;',
			'music': '&#xe0b1;',
			'mute': '&#xe0b2;',
			'no-signal': '&#xe0b3;',
			'notebook-in': '&#xe0b4;',
			'notes': '&#xe0b5;',
			'numbered-input': '&#xe0b6;',
			'numbered-output': '&#xe0b7;',
			'off-hook': '&#xe0b8;',
			'other-phone': '&#xe0b9;',
			'outbox': '&#xe0ba;',
			'outgoing-call': '&#xe0bb;',
			'panel-shift-left': '&#xe0bc;',
			'panel-shift-right': '&#xe0bd;',
			'parked': '&#xe0be;',
			'participant-list': '&#xe0bf;',
			'pass-mouse': '&#xe0c0;',
			'pause': '&#xe0c1;',
			'pc': '&#xe0c2;',
			'pencil': '&#xe0c3;',
			'persistent-chat': '&#xe0c4;',
			'phone-cross': '&#xe0c5;',
			'phone': '&#xe0c6;',
			'picture-in-picture': '&#xe0c7;',
			'pin': '&#xe0c8;',
			'play-contained': '&#xe0c9;',
			'play': '&#xe0ca;',
			'playlist': '&#xe0cb;',
			'plugin': '&#xe0cc;',
			'point': '&#xe0cd;',
			'poll': '&#xe0ce;',
			'popout': '&#xe0cf;',
			'popup-dialogue': '&#xe0d0;',
			'power-contain': '&#xe0d1;',
			'power': '&#xe0d2;',
			'presentation': '&#xe0d3;',
			'prevent-download-contain': '&#xe0d4;',
			'prevent-download': '&#xe0d5;',
			'print': '&#xe0d6;',
			'priority': '&#xe0d7;',
			'privacy': '&#xe0d8;',
			'private': '&#xe0d9;',
			'profile-settings': '&#xe0da;',
			'proximity-not-connected': '&#xe0db;',
			'proximity': '&#xe0dc;',
			'quality': '&#xe0dd;',
			'question-circle': '&#xe0de;',
			'raise-hand': '&#xe0df;',
			'read-email': '&#xe0e0;',
			'recent-apps': '&#xe0e1;',
			'record': '&#xe0e2;',
			'redial': '&#xe0e3;',
			'refresh': '&#xe0e4;',
			'remove-contact': '&#xe0e5;',
			'remove-contain': '&#xe0e6;',
			'remove-outline': '&#xe0e7;',
			'remove': '&#xe0e8;',
			'reply-all': '&#xe0e9;',
			'report': '&#xe0ea;',
			'reset': '&#xe0eb;',
			'right-arrow-closed-contained': '&#xe0ec;',
			'right-arrow-closed-outline': '&#xe0ed;',
			'right-arrow-contain': '&#xe0ee;',
			'right-arrow-contained': '&#xe0ef;',
			'right-arrow-outline': '&#xe0f0;',
			'right-arrow': '&#xe0f1;',
			'ringer-settings': '&#xe0f2;',
			'rtprx-rtptx-duplex': '&#xe0f3;',
			'rtprx': '&#xe0f4;',
			'rtptx': '&#xe0f5;',
			'running-application': '&#xe0f6;',
			'save': '&#xe0f7;',
			'schedule-add': '&#xe0f8;',
			'screen-capture-square': '&#xe0f9;',
			'screen-capture': '&#xe0fa;',
			'sd': '&#xe0fb;',
			'search': '&#xe0fc;',
			'self-view-alt': '&#xe0fd;',
			'self-view-crossed': '&#xe0fe;',
			'self-view': '&#xe0ff;',
			'send-email': '&#xe100;',
			'send': '&#xe101;',
			'sent': '&#xe102;',
			'setup-assistant': '&#xe103;',
			'share-contain': '&#xe104;',
			'share-content': '&#xe105;',
			'share': '&#xe106;',
			'sign-in': '&#xe107;',
			'sign-out': '&#xe108;',
			'signal-1': '&#xe109;',
			'signal-2': '&#xe10a;',
			'signal-3': '&#xe10b;',
			'signal-4': '&#xe10c;',
			'skip-bw': '&#xe10d;',
			'skip-fw': '&#xe10e;',
			'slides': '&#xe10f;',
			'soft-phone': '&#xe110;',
			'sound': '&#xe111;',
			'space': '&#xe112;',
			'spam': '&#xe113;',
			'speaker-cross': '&#xe114;',
			'speaker-out-left': '&#xe115;',
			'speaker': '&#xe116;',
			'speed-dial': '&#xe117;',
			'star': '&#xe118;',
			'stop': '&#xe119;',
			'storage': '&#xe11a;',
			'subscribe': '&#xe11b;',
			'swap-calls': '&#xe11c;',
			'swap-camera': '&#xe11d;',
			'swap-video-camera': '&#xe11e;',
			'tables': '&#xe11f;',
			'tablet': '&#xe120;',
			'text-color': '&#xe121;',
			'text-format': '&#xe122;',
			'text-size': '&#xe123;',
			'text': '&#xe124;',
			'thumbnail-view': '&#xe125;',
			'time': '&#xe126;',
			'timeline': '&#xe127;',
			'too-fast': '&#xe128;',
			'too-slow': '&#xe129;',
			'tools': '&#xe12a;',
			'touch-gesture': '&#xe12b;',
			'touch-point': '&#xe12c;',
			'touch': '&#xe12d;',
			'transcript': '&#xe12e;',
			'transfer-to-mobile': '&#xe12f;',
			'trash': '&#xe130;',
			'universal-inbox': '&#xe131;',
			'unlock': '&#xe132;',
			'upload-contain': '&#xe133;',
			'upload': '&#xe134;',
			'usb': '&#xe135;',
			'user': '&#xe136;',
			'vibrate': '&#xe137;',
			'video-cross': '&#xe138;',
			'video-input': '&#xe139;',
			'video-layout': '&#xe13a;',
			'video-settings': '&#xe13b;',
			'video-tips': '&#xe13c;',
			'video': '&#xe13d;',
			'view-feed-dual': '&#xe13e;',
			'view-feed-multi': '&#xe13f;',
			'view-feed-single': '&#xe140;',
			'view-preview-telepresence': '&#xe141;',
			'view-side-by-side': '&#xe142;',
			'view-stacked': '&#xe143;',
			'voicemail': '&#xe144;',
			'volume-cross': '&#xe145;',
			'volume': '&#xe146;',
			'waiting-silence': '&#xe147;',
			'wallpaper': '&#xe148;',
			'warning': '&#xe149;',
			'watchlist': '&#xe14a;',
			'web-camera': '&#xe14b;',
			'web-sharing': '&#xe14c;',
			'webex': '&#xe14d;',
			'week': '&#xe14e;',
			'whiteboard-cross': '&#xe14f;',
			'whiteboard': '&#xe150;',
			'wifi': '&#xe151;',
			'work': '&#xe152;',
			'zip': '&#xe153;',
			'zoom-in': '&#xe154;',
			'zoom-out': '&#xe155;',
			'0': 0
		};
		delete icons['0'];
		window.icomoonLiga = function (els) {
			var classes,
				el,
				i,
				innerHTML,
				key;
			els = els || document.getElementsByTagName('*');
			if (!els.length) {
				els = [els];
			}
			for (i = 0; ; i += 1) {
				el = els[i];
				if (!el) {
					break;
				}
				classes = el.className;
				if (/icon-/.test(classes)) {
					innerHTML = el.innerHTML;
					if (innerHTML && innerHTML.length > 1) {
						for (key in icons) {
							if (icons.hasOwnProperty(key)) {
								innerHTML = innerHTML.replace(new RegExp(key, 'g'), icons[key]);
							}
						}
						el.innerHTML = innerHTML;
					}
				}
			}
		};
		window.icomoonLiga();
	}
}());