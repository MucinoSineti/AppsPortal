/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["enviarnotaextfront/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
