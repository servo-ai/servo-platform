b3e.editor.ImportManager = function (editor) {
  "use strict";

  this.projectAsData = function (data) {
    var project = editor.project.get();
    if (!project) return;

    if (data.custom_nodes) this.nodesAsData(data.custom_nodes);
    if (data.trees) {
      var project = editor.project.get();
      if (!project) return;
      // remove all trees at this point
      project.trees.each(function (tree) {
        project.trees.remove(tree, true /*leave none*/ );
      })
      this.treesAsData(data.trees);
    }
    if (data.selectedTree) {
      project.trees.select(data.selectedTree);
    }
    editor.trigger('projectimported');
  };

  this.treeAsData = function (data, useSelected) {
    var project = editor.project.get();
    if (!project) return;

    // if we come from project import, we dont have a selected tree yet
    var tree = useSelected ? project.trees.getSelected() : project.trees.get(data.id);
    if (!tree) {
      throw {
        message: "No selected tree. strange... Import of trees must have a tree id that already exists"
      };
    }
    var root = tree.blocks.getRoot();
    var first = null;

    // change data ids to the imported
    data.id = data.name = data.title = tree._id;
    // Tree data
    var display = data.display || {};
    tree.x = display.camera_x || 0;
    tree.y = display.camera_y || 0;
    tree.scaleX = display.camera_z || 1;
    tree.scaleY = display.camera_z || 1;
    var treeNode = project.nodes.get(tree._id);
    treeNode.title = data.title;

    root.title = data.title;
    root.description = data.description;
    root.properties = data.properties;
    root.x = display.x || 0;
    root.y = display.y || 0;

    // Custom nodes
    if (data.custom_nodes) this.nodesAsData(data.custom_nodes);

    var id, spec;

    // Add blocks
    for (id in data.nodes) {
      spec = data.nodes[id];
      var block = null;
      spec.display = spec.display || {};
      display = spec.display;

      block = tree.blocks.add(spec.name, spec.display.x, spec.display.y);
      block.id = spec.id;
      block.title = spec.title;
      block.description = spec.description;
      block.properties = tine.merge({}, block.properties, spec.properties);
      block._redraw();

      if (spec.id === data.root) {
        first = block;
      }
    }

    // Add connections
    for (id in data.nodes) {
      spec = data.nodes[id];
      var inBlock = tree.blocks.get(id);

      var children = null;
      if (inBlock.category === 'composite' && spec.children) {
        children = spec.children;
      } else if (spec.child && (inBlock.category == 'decorator' ||
          inBlock.category === 'mlmodel' ||
          inBlock.category == 'root')) {
        children = [spec.child];
      }

      if (children) {
        for (var i = 0; i < children.length; i++) {
          var outBlock = tree.blocks.get(children[i]);
          tree.connections.add(inBlock, outBlock);
        }
      }
    }

    // Finish
    if (first) {
      tree.connections.add(root, first);
    }

    if (!data.display) {
      tree.organize.organize(true);
    }

    tree.selection.deselectAll();
    tree.selection.select(root);
    project.history.clear();

    editor.trigger('treeimported');
  };

  this.treesAsData = function (data) {
    var project = editor.project.get();
    if (!project) return;

    for (var i = 0; i < data.length; i++) {
      project.trees.add(data[i].id);
    }

    for (var i = 0; i < data.length; i++) {
      try {
        this.treeAsData(data[i]);
      } catch (ex) {
        console.error('tree ' + data[i].id + ' failed', ex)
      }

    }
  };

  this.nodesAsData = function (data) {
    var project = editor.project.get();
    if (!project) return;

    for (var i = 0; i < data.length; i++) {
      var template = data[i];
      project.nodes.add(template);
    }
    editor.trigger('nodeimported');
  };
  this._applySettings = function (settings) {};
};
