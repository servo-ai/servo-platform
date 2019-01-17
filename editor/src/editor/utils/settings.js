/**
 * Default settings of the editor.
 *
 * @constant {Object} DEFAULT_SETTINGS
 * @memberOf b3e
 */

(function () {
  "use strict";

  var DEFAULT_SETTINGS = {
    // CAMERA
    zoom_initial: 1.0,
    zoom_min: 0.25,
    zoom_max: 2.0,
    zoom_step: 0.25,

    // EDITOR
    snap_x: 2,
    snap_y: 2,
    snap_offset_x: 0,
    snap_offset_y: 0,
    layout: 'vertical', // vertical
    max_history: 100,

    // COLORS
    background_color: '#171717',
    selection_color: '#4BB2FD',
    block_border_color: '#6D6D6D',
    block_symbol_color: '#333333',
    anchor_background_color: '#EFEFEF',

    connection_color: '#00c7cf',
    root_color: '#FFFFFF',
    decorator_color: '#ff8c55',
    composite_color: '#FFFFFF',
    tree_color: '#80ff80',
    action_color: '#8080ff',
    condition_color: '#00ffff',
    mlmodel_color: '#ffff80',

    // CONNECTION
    connection_width: 2,

    // ANCHOR
    anchor_border_width: 2,
    anchor_radius: 7,
    anchor_offset_x: 4,
    anchor_offset_y: 0,

    // BLOCK
    block_border_width: 2,
    block_root_width: 40,
    block_root_height: 40,
    block_tree_width: 160,
    block_tree_height: 40,
    block_composite_width: 40,
    block_composite_height: 40,
    block_decorator_width: 60,
    block_decorator_height: 60,
    block_action_width: 160,
    block_action_height: 40,
    block_condition_width: 160,
    block_condition_height: 40,
    block_mlmodel_width: 160,
    block_mlmodel_height: 40,
  };

  b3e.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
})();
