/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule splitBlockInContentState
 * @typechecks
 * @flow
 */

'use strict';

var Immutable = require('immutable');

var generateRandomKey = require('generateRandomKey');
var invariant = require('invariant');

import type ContentState from 'ContentState';
import type SelectionState from 'SelectionState';

const {Map} = Immutable;

function splitBlockInContentState(
  contentState: ContentState,
  selectionState: SelectionState,
): ContentState {
  invariant(
    selectionState.isCollapsed(),
    'Selection range must be collapsed.',
  );

  var key = selectionState.getAnchorKey();
  var offset = selectionState.getAnchorOffset();
  var blockMap = contentState.getBlockMap();
  var blockToSplit = blockMap.get(key);

  var text = blockToSplit.getText();
  var chars = blockToSplit.getCharacterList();

  var blockAbove = blockToSplit.merge({
    text: text.slice(0, offset),
    characterList: chars.slice(0, offset),
  });

  var keyBelow = generateRandomKey();
  var blockBelow = blockAbove.merge({
    key: keyBelow,
    text: text.slice(offset),
    characterList: chars.slice(offset),
    data: Map(),
  });

  var blocksBefore = blockMap.toSeq().takeUntil(v => v === blockToSplit);
  var blocksAfter = blockMap.toSeq().skipUntil(v => v === blockToSplit).rest();
  var newBlocks = blocksBefore.concat(
    [[blockAbove.getKey(), blockAbove], [blockBelow.getKey(), blockBelow]],
    blocksAfter,
  ).toOrderedMap();

  return contentState.merge({
    blockMap: newBlocks,
    selectionBefore: selectionState,
    selectionAfter: selectionState.merge({
      anchorKey: keyBelow,
      anchorOffset: 0,
      focusKey: keyBelow,
      focusOffset: 0,
      isBackward: false,
    }),
  });
}

module.exports = splitBlockInContentState;
