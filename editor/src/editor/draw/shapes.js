(function () {
  "use strict";


  var makeAnchor = function (shape, x, y, radius, bg_color, border_width, border_color, breakpoint) {
    breakpoint = breakpoint || {};
    shape.graphics.beginFill(breakpoint.breakpointSet ? 'red' : bg_color);
    shape.graphics.setStrokeStyle(border_width, 'round');
    shape.graphics.beginStroke(border_color);
    shape.graphics.drawCircle(x, y, breakpoint.breakpointSet ? Math.max(11, radius) : radius);
    shape.graphics.endStroke();
    shape.graphics.endFill();
    if (breakpoint.breakpointReached) {
      shape.graphics.beginStroke("red").setStrokeStyle(5, "round").arc(0, -40, 35, 0, Math.PI, true);
    }

  };

  var makeRect = function (shape, w, h, radius, bg_color, border_width, border_color, invalidated) {
    if (invalidated) {
      border_color = 'red'
      border_width *= 1.5;
      shape.graphics.setStrokeDash([20, 10]);
    }
    shape.graphics.beginFill(bg_color);
    shape.graphics.setStrokeStyle(border_width, 'round');
    shape.graphics.beginStroke(border_color);
    shape.graphics.drawRoundRect(-w / 2, -h / 2, w, h, radius);
    shape.graphics.endStroke();
    shape.graphics.endFill();
  };

  var makeTree = function (shape, w, h, radius, bg_color, border_width, border_color, invalidated) {
    if (invalidated) {
      border_color = 'red'
      border_width *= 1.5;
      shape.graphics.setStrokeDash([20, 10]);
    }
    shape.graphics.beginFill(bg_color);
    shape.graphics.setStrokeStyle(border_width, 'round');
    shape.graphics.beginStroke(border_color);
    shape.graphics.moveTo(-w / 2, 0);
    shape.graphics.lineTo(-w / 2 + 10, -h / 2);
    shape.graphics.lineTo(w / 2 - 10, -h / 2);
    shape.graphics.lineTo(w / 2, 0);
    shape.graphics.lineTo(w / 2 - 10, h / 2);
    shape.graphics.lineTo(-w / 2 + 10, h / 2);
    shape.graphics.lineTo(-w / 2, 0);
    shape.graphics.endStroke();
    shape.graphics.endFill();
  };

  var makeEllipse = function (shape, w, h, bg_color, border_width, border_color, invalidated) {
    if (invalidated) {
      border_color = 'red'
      border_width *= 1.5;
      shape.graphics.setStrokeDash([20, 10]);
    }
    shape.graphics.beginFill(bg_color);
    shape.graphics.setStrokeStyle(border_width, 'round');
    shape.graphics.beginStroke(border_color);
    shape.graphics.drawEllipse(-w / 2, -h / 2, w, h);
    shape.graphics.endStroke();
    shape.graphics.endFill();
  };

  var makeRhombus = function (shape, w, h, bg_color, border_width, border_color, invalidated) {
    if (invalidated) {
      border_color = 'red'
      border_width *= 1.5;
      shape.graphics.setStrokeDash([20, 10]);
    }
    shape.graphics.beginFill(bg_color);
    shape.graphics.setStrokeStyle(border_width, 'round');
    shape.graphics.beginStroke(border_color);
    shape.graphics.moveTo(0, h / 2);
    shape.graphics.lineTo(w / 2, 0);
    shape.graphics.lineTo(0, -h / 2);
    shape.graphics.lineTo(-w / 2, 0);
    shape.graphics.lineTo(0, h / 2);
    shape.graphics.endStroke();
    shape.graphics.endFill();
  };

  var makeTriangle = function (shape, w, h, bg_color, border_width, border_color, invalidated) {
    if (invalidated) {
      border_color = 'red'
      border_width *= 1.5;
      shape.graphics.setStrokeDash([20, 10]);
    }
    shape.graphics.beginFill(bg_color);
    shape.graphics.setStrokeStyle(border_width, 'round');
    shape.graphics.beginStroke(border_color);
    shape.graphics.moveTo(0, h / 2);
    shape.graphics.lineTo(w / 2, 0);
    shape.graphics.lineTo(-w / 2, 0);
    shape.graphics.lineTo(0, h / 2);
    shape.graphics.endStroke();
    shape.graphics.endFill();
  };

  var makeTrapezoid = function (shape, w, h, bg_color, border_width, border_color, invalidated) {
    if (invalidated) {
      border_color = 'red'
      border_width *= 1.5;
      shape.graphics.setStrokeDash([20, 10]);
    }
    shape.graphics.beginFill(bg_color);
    shape.graphics.setStrokeStyle(border_width, 'round');
    shape.graphics.beginStroke(border_color);
    shape.graphics.moveTo(-0.25 * w, h / 2);
    shape.graphics.lineTo(0.25 * w, h / 2);
    shape.graphics.lineTo(w / 2, -h / 2);
    shape.graphics.lineTo(-w / 2, -h / 2);
    shape.graphics.lineTo(-0.25 * w, h / 2);
    shape.graphics.endStroke();
    shape.graphics.endFill();
  };

  b3e.draw.rootShape = function (block, settings, invalidated) {
    var w = block._width;
    var h = block._height;
    var anchorOffsetX = settings.get('anchor_offset_x');
    var shape = block._displayShape;

    var x = 0;
    var y = 0;
    if (settings.get('layout') === 'horizontal') {
      x = w / 2 + anchorOffsetX;
    } else {
      y = h / 2 + anchorOffsetX;
    }

    makeAnchor(shape, x, y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color')
    );
    makeRect(shape, w, h, 15,
      settings.get('root_color'),
      settings.get('block_border_width'),
      settings.get('block_border_color'),
      invalidated
    );
    return shape;
  };

  b3e.draw.compositeShape = function (block, settings, invalidated, breakpoint) {
    var bounds = block._displaySymbol.getBounds();
    var _width = 0;

    if (bounds) {
      _width = bounds.width + 20;
    }

    var w = Math.max(_width, block._width);
    var h = block._height;
    var anchorOffsetX = settings.get('anchor_offset_x');
    var shape = block._displayShape;
    block._width = w;
    block._height = h;

    var x = 0;
    var y = 0;
    if (settings.get('layout') === 'horizontal') {
      x = w / 2 + anchorOffsetX;
    } else {
      y = h / 2 + anchorOffsetX;
    }
    makeAnchor(shape, x, y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color'), breakpoint
    );
    makeAnchor(shape, -x, -y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color')
    );
    makeRect(shape, w, h, 15,
      settings.get('composite_color'),
      settings.get('block_border_width'),
      settings.get('block_border_color'),
      invalidated
    );
    return shape;
  };


  b3e.draw.mlmodelShape = function (block, settings, invalidated, breakpoint) {
    var bounds = block._displaySymbol.getBounds();

    var w = Math.max(bounds.width + 40, block._width);
    var h = Math.max(bounds.height + 50, block._height);
    var anchorOffsetX = settings.get('anchor_offset_x');
    var shape = block._displayShape;
    block._width = w;
    block._height = h;

    var x = 0;
    var y = 0;
    if (settings.get('layout') === 'horizontal') {
      x = w / 2 + anchorOffsetX;
    } else {
      y = h / 2 + anchorOffsetX;
    }
    makeAnchor(shape, x, y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color'), breakpoint
    );
    makeAnchor(shape, -x, -y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color')
    );

    makeTrapezoid(shape, w, h,
      settings.get('mlmodel_color'),
      settings.get('block_border_width'),
      settings.get('block_border_color'),
      invalidated
    );
    return shape;
  };


  b3e.draw.decoratorShape = function (block, settings, invalidated, breakpoint) {
    var bounds = block._displaySymbol.getBounds();

    var w = Math.max(bounds.width + 40, block._width);
    var h = Math.max(bounds.height + 50, block._height);
    var anchorOffsetX = settings.get('anchor_offset_x');
    var shape = block._displayShape;
    block._width = w;
    block._height = h;

    var x = 0;
    var y = 0;
    if (settings.get('layout') === 'horizontal') {
      x = w / 2 + anchorOffsetX;
    } else {
      y = h / 2 + anchorOffsetX;
    }
    makeAnchor(shape, x, y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color'), breakpoint
    );
    makeAnchor(shape, -x, -y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color')
    );

    makeRhombus(shape, w, h,
      settings.get('decorator_color'),
      settings.get('block_border_width'),
      settings.get('block_border_color'),
      invalidated
    );
    return shape;
  };

  b3e.draw.actionShape = function (block, settings, invalidated, breakpoint) {

    var bounds = block._displaySymbol.getBounds();
    var w = Math.max(bounds.width + 15, block._width);
    var h = Math.max(bounds.height + 15, block._height);
    var anchorOffsetX = settings.get('anchor_offset_x');
    var shape = block._displayShape;
    block._width = w;
    block._height = h;

    var x = 0;
    var y = 0;
    if (settings.get('layout') === 'horizontal') {
      x = w / 2 + anchorOffsetX;
    } else {
      y = h / 2 + anchorOffsetX;
    }
    makeAnchor(shape, -x, -y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color'), breakpoint
    );
    makeRect(shape, w, h, 15,
      settings.get('action_color'),
      settings.get('block_border_width'),
      settings.get('block_border_color'),
      invalidated
    );
    return shape;
  };

  b3e.draw.conditionShape = function (block, settings, invalidated, breakpoint) {
    var bounds = block._displaySymbol.getBounds();

    var w = Math.max(bounds.width + 15, block._width);
    var h = Math.max(bounds.height + 15, block._height);
    var anchorOffsetX = settings.get('anchor_offset_x');
    var shape = block._displayShape;
    block._width = w;
    block._height = h;

    makeAnchor(shape, -w / 2 - anchorOffsetX, 0,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color'), breakpoint
    );
    makeEllipse(shape, w, h,
      settings.get('condition_color'),
      settings.get('block_border_width'),
      settings.get('block_border_color'),
      invalidated
    );
    return shape;
  };

  b3e.draw.treeShape = function (block, settings, invalidated, breakpoint) {
    var bounds = block._displaySymbol.getBounds();
    var w = Math.max(bounds.width + 15, block._width);
    var h = Math.max(bounds.height + 15, block._height);
    var anchorOffsetX = settings.get('anchor_offset_x');
    var shape = block._displayShape;
    block._width = w;
    block._height = h;

    var x = 0;
    var y = 0;
    if (settings.get('layout') === 'horizontal') {
      x = w / 2 + anchorOffsetX;
    } else {
      y = h / 2 + anchorOffsetX;
    }
    makeAnchor(shape, -x, -y,
      settings.get('anchor_radius'),
      settings.get('anchor_background_color'),
      settings.get('anchor_border_width'),
      settings.get('block_border_color'), breakpoint
    );
    makeTree(shape, w, h, 15,
      settings.get('tree_color'),
      settings.get('block_border_width'),
      settings.get('block_border_color'),
      invalidated
    );
    return shape;
  };

  b3e.draw.SHAPES = {
    'root': b3e.draw.rootShape,
    'tree': b3e.draw.treeShape,
    'composite': b3e.draw.compositeShape,
    'decorator': b3e.draw.decoratorShape,
    'action': b3e.draw.actionShape,
    'condition': b3e.draw.conditionShape,
    'mlmodel': b3e.draw.mlmodelShape
  };

}());