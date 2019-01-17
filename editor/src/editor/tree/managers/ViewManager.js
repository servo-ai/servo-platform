b3e.tree.ViewManager = function (editor, project, tree) {
  "use strict";

  this.reset = function () {
    tree.x = 0;
    tree.y = 0;
    tree.scaleX = 1;
    tree.scaleY = 1;

  };
  this.zoom = function (factor) {
    tree.scaleX = factor;
    tree.scaleY = factor;
  };
  this.zoomIn = function () {
    var min = editor._settings.get('zoom_min');
    var max = editor._settings.get('zoom_max');
    var step = editor._settings.get('zoom_step');

    var zoom = tree.scaleX;
    this.zoom(tine.clip(zoom + step, min, max));
  };
  this.zoomOut = function () {
    var min = editor._settings.get('zoom_min');
    var max = editor._settings.get('zoom_max');
    var step = editor._settings.get('zoom_step');

    var zoom = tree.scaleX;
    this.zoom(tine.clip(zoom - step, min, max));
  };
  this.pan = function (dx, dy) {
    tree.x += dx;
    tree.y += dy;
  };
  this.setCam = function (x, y) {
    tree.x = x;
    tree.y = y;
  };
  this.center = function () {
    // calculate where we want to be (center screen)
    var canvas = editor._game.canvas;
    var hw = canvas.width / 2;
    var hh = canvas.height / 2;
    // calculate delta
    var dx = tree.x - hw;
    var dy = tree.y - hh;
    console.log('center', hw, hh, dx, dy, tree.x, tree.y);
    // now move all the blocks
    for (var i = 0; i < tree.blocks.getAll().length; i++) {
      var block = tree.blocks.getAll()[i];

      if (block.name === 'Root') {
        var rootpos = tree.localToGlobal(block.x, block.y);
        break;
      }

    }

    var deltaRoot = {
      x: rootpos.x - hw,
      y: rootpos.y - hh
    }
    this.setCam(hw, hh);
    // now move all the blocks
    for (var i = 0; i < tree.blocks.getAll().length; i++) {
      var block = tree.blocks.getAll()[i];

      var pt = tree.localToGlobal(block.x, block.y);
      var pt2 = tree.globalToLocal(pt.x - deltaRoot.x, pt.y - deltaRoot.y);
      block.y = pt2.y;
      block.x = pt2.x;
      console.log('block', pt, pt2, tree.x, tree.y, hw, hh)

      block._snap();

      // redraw connections linked to the entity
      if (block._inConnection) {
        block._inConnection._redraw();
      }
      for (var j = 0; j < block._outConnections.length; j++) {
        block._outConnections[j]._redraw();
      }
    }

    //  this.zoom(1.0);
  };

  this.getLocalPoint = function (x, y) {
    if (typeof x == 'undefined') x = editor._game.mouse.x;
    if (typeof y == 'undefined') y = editor._game.mouse.y;
    return tree.globalToLocal(x, y);
  };

  this._applySettings = function (settings) {};
};
