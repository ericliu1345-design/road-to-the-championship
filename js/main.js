// Starts the game once the hand-drawn fonts are ready (otherwise the first text would draw in a plain font).
(function boot() {
  const fontsReady = document.fonts
    ? Promise.all([
      document.fonts.load('40px "Permanent Marker"'),
      document.fonts.load('24px "Patrick Hand"'),
    ])
    : Promise.resolve();

  fontsReady.catch(() => {}).then(() => {
    new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      width: W,
      height: H,
      backgroundColor: '#f7f3e8',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      dom: { createContainer: true },       // lets the setup screen use real text boxes
      input: { gamepad: true, activePointers: 3 },
      scene: [TitleScene, SetupScene, HubScene, MeetScene, RaceScene, HowToScene, EndingScene],
    });
  });
})();
