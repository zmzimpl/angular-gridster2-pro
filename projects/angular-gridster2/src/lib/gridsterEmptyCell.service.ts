import {Injectable} from '@angular/core';

import {GridsterUtils} from './gridsterUtils.service';
import {GridsterItem, GridsterItemSplitMode} from './gridsterItem.interface';
import {GridsterComponentInterface} from './gridster.interface';
import { GridsterItemComponentInterface } from './gridsterItemComponent.interface';
import { GridType } from './gridsterConfig.interface';

@Injectable()
export class GridsterEmptyCell {
  initialItem: GridsterItem | null;
  emptyCellClick: Function | null;
  emptyCellClickTouch: Function | null;
  emptyCellContextMenu: Function | null;
  emptyCellDrop: Function | null;
  emptyCellDrag: Function | null;
  emptyCellDragTouch: Function | null;
  emptyCellMMove: Function;
  emptyCellMMoveTouch: Function;
  emptyCellUp: Function;
  emptyCellUpTouch: Function;
  emptyCellMove: Function | null;
  emptyCellExit: Function | null;

  constructor(private gridster: GridsterComponentInterface) {
  }

  destroy(): void {
    delete this.initialItem;
    delete this.gridster.movingItem;
    if (this.gridster.previewStyle) {
      this.gridster.previewStyle();
    }
    delete this.gridster;
    if (this.emptyCellExit) {
      this.emptyCellExit();
      this.emptyCellExit = null;
    }
  }

  updateOptions(): void {
    if (this.gridster.$options.enableEmptyCellClick && !this.emptyCellClick && this.gridster.options.emptyCellClickCallback) {
      this.emptyCellClick = this.gridster.renderer.listen(this.gridster.el, 'click', this.emptyCellClickCb.bind(this));
      this.emptyCellClickTouch = this.gridster.renderer.listen(this.gridster.el, 'touchend', this.emptyCellClickCb.bind(this));
    } else if (!this.gridster.$options.enableEmptyCellClick && this.emptyCellClick && this.emptyCellClickTouch) {
      this.emptyCellClick();
      this.emptyCellClickTouch();
      this.emptyCellClick = null;
      this.emptyCellClickTouch = null;
    }
    if (this.gridster.$options.enableEmptyCellContextMenu && !this.emptyCellContextMenu &&
      this.gridster.options.emptyCellContextMenuCallback) {
      this.emptyCellContextMenu = this.gridster.renderer.listen(this.gridster.el, 'contextmenu', this.emptyCellContextMenuCb.bind(this));
    } else if (!this.gridster.$options.enableEmptyCellContextMenu && this.emptyCellContextMenu) {
      this.emptyCellContextMenu();
      this.emptyCellContextMenu = null;
    }
    if (this.gridster.$options.enableEmptyCellDrop && !this.emptyCellDrop && this.gridster.options.emptyCellDropCallback) {
      this.emptyCellDrop = this.gridster.renderer.listen(this.gridster.el, 'drop', this.emptyCellDragDrop.bind(this));
      this.gridster.zone.runOutsideAngular(() => {
        this.emptyCellMove = this.gridster.renderer.listen(this.gridster.el, 'dragover', this.emptyCellDragOver.bind(this));
      });
      this.emptyCellExit = this.gridster.renderer.listen('document', 'dragend', () => {
        this.gridster.movingItem = null;
        this.gridster.previewStyle();
      });
    } else if (!this.gridster.$options.enableEmptyCellDrop && this.emptyCellDrop && this.emptyCellMove && this.emptyCellExit) {
      this.emptyCellDrop();
      this.emptyCellMove();
      this.emptyCellExit();
      this.emptyCellMove = null;
      this.emptyCellDrop = null;
      this.emptyCellExit = null;
    }
    if (this.gridster.$options.enableEmptyCellDrag && !this.emptyCellDrag && this.gridster.options.emptyCellDragCallback) {
      this.emptyCellDrag = this.gridster.renderer.listen(this.gridster.el, 'mousedown', this.emptyCellMouseDown.bind(this));
      this.emptyCellDragTouch = this.gridster.renderer.listen(this.gridster.el, 'touchstart', this.emptyCellMouseDown.bind(this));
    } else if (!this.gridster.$options.enableEmptyCellDrag && this.emptyCellDrag && this.emptyCellDragTouch) {
      this.emptyCellDrag();
      this.emptyCellDragTouch();
      this.emptyCellDrag = null;
      this.emptyCellDragTouch = null;
    }
  }

  emptyCellClickCb(e: any): void {
    if (this.gridster.movingItem || GridsterUtils.checkContentClassForEmptyCellClickEvent(this.gridster, e)) {
      return;
    }
    const item = this.getValidItemFromEvent(e);
    if (!item) {
      return;
    }
    if (this.gridster.options.emptyCellClickCallback) {
      this.gridster.options.emptyCellClickCallback(e, item);
    }
    this.gridster.cdRef.markForCheck();
  }

  emptyCellContextMenuCb(e: any): void {
    if (this.gridster.movingItem || GridsterUtils.checkContentClassForEmptyCellClickEvent(this.gridster, e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const item = this.getValidItemFromEvent(e);
    if (!item) {
      return;
    }
    if (this.gridster.options.emptyCellContextMenuCallback) {
      this.gridster.options.emptyCellContextMenuCallback(e, item);
    }
    this.gridster.cdRef.markForCheck();
  }

  emptyCellDragDrop(e: any): void {
    const item = this.getValidItemFromEvent(e);
    if (!item) {
      return;
    }
    // 分裂模式
    if (item.spliting && item.splitingItemComponent) {
      const overItem = item.splitingItemComponent.item;
      switch (item.spliting) {
        case GridsterItemSplitMode.up:
          overItem.y += item.rows;
          overItem.rows = overItem.rows - item.rows;
          break;
        case GridsterItemSplitMode.down:
          overItem.rows = overItem.rows - item.rows;
          break;
        case GridsterItemSplitMode.left:
          overItem.x += item.cols;
          overItem.cols = overItem.cols - item.cols;
          break;
        case GridsterItemSplitMode.right:
          overItem.cols = overItem.cols - item.cols;
          break;
      }
      item.splitingItemComponent.updateOptions();
    }
    if (this.gridster.options.emptyCellDropCallback) {
      this.gridster.options.emptyCellDropCallback(e, item);
    }
    this.gridster.cdRef.markForCheck();
  }

  emptyCellDragOver(e: any): void {
    e.preventDefault();
    e.stopPropagation();
    // 通道过滤，不能让所有东西都能拖拽进来
    const draggingDom = (<any>e.srcElement || e.target).ownerDocument.querySelector('[dragChannel]');
    if (!draggingDom || 'gridster' != draggingDom.getAttribute('dragChannel')) {
      e.dataTransfer.dropEffect = 'none';
      this.gridster.movingItem = null;
      return;
    }
    const item = this.getValidItemFromEvent(e);
    console.log(item);
    if (item) {
      e.dataTransfer.dropEffect = 'move';
      this.gridster.movingItem = item;
    } else {
      e.dataTransfer.dropEffect = 'none';
      this.gridster.movingItem = null;
    }
    this.gridster.previewStyle();
  }

  emptyCellMouseDown(e: any): void {
    if (GridsterUtils.checkContentClassForEmptyCellClickEvent(this.gridster, e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const item = this.getValidItemFromEvent(e);
    const leftMouseButtonCode = 1;
    if (!item || e.buttons !== leftMouseButtonCode) {
      return;
    }
    this.initialItem = item;
    this.gridster.movingItem = item;
    this.gridster.previewStyle();
    this.gridster.zone.runOutsideAngular(() => {
      this.emptyCellMMove = this.gridster.renderer.listen('window', 'mousemove', this.emptyCellMouseMove.bind(this));
      this.emptyCellMMoveTouch = this.gridster.renderer.listen('window', 'touchmove', this.emptyCellMouseMove.bind(this));
    });
    this.emptyCellUp = this.gridster.renderer.listen('window', 'mouseup', this.emptyCellMouseUp.bind(this));
    this.emptyCellUpTouch = this.gridster.renderer.listen('window', 'touchend', this.emptyCellMouseUp.bind(this));
  }

  emptyCellMouseMove(e: any): void {
    e.preventDefault();
    e.stopPropagation();
    console.log(e);
    const item = this.getValidItemFromEvent(e, this.initialItem);
    console.log(item);
    if (!item) {
      return;
    }

    this.gridster.movingItem = item;
    this.gridster.previewStyle();
  }

  emptyCellMouseUp(e: any): void {
    this.emptyCellMMove();
    this.emptyCellMMoveTouch();
    this.emptyCellUp();
    this.emptyCellUpTouch();
    const item = this.getValidItemFromEvent(e, this.initialItem);
    if (item) {
      this.gridster.movingItem = item;
    }
    if (this.gridster.options.emptyCellDragCallback && this.gridster.movingItem) {
      this.gridster.options.emptyCellDragCallback(e, this.gridster.movingItem);
    }
    setTimeout(() => {
      this.initialItem = null;
      if (this.gridster) {
        this.gridster.movingItem = null;
        this.gridster.previewStyle();
      }
    });
    this.gridster.cdRef.markForCheck();
  }

  getValidItemFromEvent(e: any, oldItem?: GridsterItem | null): GridsterItem | undefined {
    e.preventDefault();
    e.stopPropagation();
    GridsterUtils.checkTouchEvent(e);
    const rect = this.gridster.el.getBoundingClientRect();
    const x = e.clientX + this.gridster.el.scrollLeft - rect.left - this.gridster.$options.margin;
    const y = e.clientY + this.gridster.el.scrollTop - rect.top - this.gridster.$options.margin;
    let item: GridsterItem = {
      x: this.gridster.pixelsToPositionX(x, Math.floor, true),
      y: this.gridster.pixelsToPositionY(y, Math.floor, true),
      cols: this.gridster.$options.defaultItemCols,
      rows: this.gridster.$options.defaultItemRows
    };
    let overItem: GridsterItemComponentInterface;// 重叠的图表
    if (this.gridster.$options.draggable.dropOverItemSplit) { // 开启分裂，允许堆叠上其它的已存在的图表，并且最大程度占满空白单元格（通常minRows = maxRows和minCols = maxCols）
      const checkItem: GridsterItem = {
        x: Math.max(0, item.x), y: Math.max(0, item.y), cols: 1, rows: 1 // 计算重叠时，按一个格子计算
      }
      if ((overItem = <GridsterItemComponentInterface>this.gridster.findItemWithItem(checkItem))) {
        const splitUD = (overItem.$item.rows >= this.gridster.$options.minItemRows * 2 &&
          overItem.$item.cols >= this.gridster.$options.minItemCols &&
          Math.ceil(overItem.$item.rows / 2) >= (overItem.$item.minItemRows || this.gridster.$options.minItemRows)), // 允许上下分（行是2倍，列1倍，原overItem减去分裂的行之后还够自己的最小行数）
          splitLR = overItem.$item.cols >= this.gridster.$options.minItemCols * 2 &&
            overItem.$item.rows >= this.gridster.$options.minItemRows &&
            Math.ceil(overItem.$item.cols / 2) >= (overItem.$item.minItemCols || this.gridster.$options.minItemCols), // 允许左右分（列2倍，行一倍）
          halfPositionX = overItem.left + overItem.width / 2,
          halfPositionY = overItem.top + overItem.height / 2,
          angle = Math.atan2(overItem.height, overItem.width); // 计算鼠标位置与X轴夹角（对边，临边），只计算弧度也一样 * 180 / Math.PI;

        if (x < halfPositionX && y < halfPositionY) { // 左上部分
          const tmpAngle = Math.atan2(y - overItem.top, x - overItem.left); // * 180 / Math.PI;
          if (tmpAngle > angle && splitLR) { // 左边
            this.splitItem(item, overItem, GridsterItemSplitMode.left);
          } else if (splitUD) { // 上边
            this.splitItem(item, overItem, GridsterItemSplitMode.up);
          }
        } else if (x < halfPositionX && y > halfPositionY) { // 左下部分
          const tmpAngle = Math.atan2(overItem.top + overItem.height - y, x - overItem.left); // * 180 / Math.PI;
          if (tmpAngle > angle && splitLR) { // 左边
            this.splitItem(item, overItem, GridsterItemSplitMode.left);
          } else if (splitUD) { // 下边
            this.splitItem(item, overItem, GridsterItemSplitMode.down);
          }
        } else if (x > halfPositionX && y < halfPositionY) { // 右上部分
          const tmpAngle = Math.atan2(y - overItem.top, overItem.left + overItem.width - x); // * 180 / Math.PI;
          if (tmpAngle > angle && splitLR) { // 右边
            this.splitItem(item, overItem, GridsterItemSplitMode.right);
          } else if (splitUD) { // 上边
            this.splitItem(item, overItem, GridsterItemSplitMode.up);
          }
        } else if (x > halfPositionX && y > halfPositionY) { // 右下部分
          const tmpAngle = Math.atan2(overItem.top + overItem.height - y, overItem.left + overItem.width - x); // * 180 / Math.PI;
          if (tmpAngle > angle && splitLR) { // 右边
            this.splitItem(item, overItem, GridsterItemSplitMode.right);
          } else if (splitUD) { // 下边
            this.splitItem(item, overItem, GridsterItemSplitMode.down);
          }
        }
      } else { // 拖拽到空白处，尽最大可能占满
        const leftReferenceItem = this.checkdReferenceItem(Object.assign({}, checkItem), 'left'), // 向左找参照物
          rightReferenceItem = this.checkdReferenceItem(Object.assign({}, checkItem), 'right'); // 向右找参照物
        checkItem.x = leftReferenceItem ? leftReferenceItem.$item.x + leftReferenceItem.$item.cols : 0;
        checkItem.cols = (rightReferenceItem ? rightReferenceItem.$item.x : this.gridster.$options.maxCols) - checkItem.x;

        if (this.gridster.$options.gridType === GridType.Fit) { //需要高度也自适应才占满高度
          const topReferenceItem = this.checkdReferenceItem(Object.assign({}, checkItem), 'top'), // 向上找参照物
            bottomReferenceItem = this.checkdReferenceItem(Object.assign({}, checkItem), 'bottom'); // 向下找参照物
          checkItem.y = topReferenceItem ? topReferenceItem.$item.y + topReferenceItem.$item.rows : 0;
          checkItem.rows = (bottomReferenceItem ? bottomReferenceItem.$item.y : this.gridster.$options.maxRows) - checkItem.y;
          item = checkItem;
        } else {
          item.x = checkItem.x;
          item.cols = checkItem.cols;
        }
      }
    }
    if (oldItem) {
      item.cols = Math.min(Math.abs(oldItem.x - item.x) + 1, this.gridster.$options.emptyCellDragMaxCols);
      item.rows = Math.min(Math.abs(oldItem.y - item.y) + 1, this.gridster.$options.emptyCellDragMaxRows);
      if (oldItem.x < item.x) {
        item.x = oldItem.x;
      } else if (oldItem.x - item.x > this.gridster.$options.emptyCellDragMaxCols - 1) {
        item.x = this.gridster.movingItem ? this.gridster.movingItem.x : 0;
      }
      if (oldItem.y < item.y) {
        item.y = oldItem.y;
      } else if (oldItem.y - item.y > this.gridster.$options.emptyCellDragMaxRows - 1) {
        item.y = this.gridster.movingItem ? this.gridster.movingItem.y : 0;
      }
    }
    // if (!this.gridster.$options.enableOccupiedCellDrop && this.gridster.checkCollision(item)) {
    //   return;
    // }
    // 非分裂需要校验单元格冲突
    if (!this.gridster.$options.draggable.dropOverItemSplit && this.gridster.checkCollision(item)) {
      return;
    }
    return item;
  }
  /** 分裂单元格 */
  splitItem(item: GridsterItem, overItem: GridsterItemComponentInterface, mode: GridsterItemSplitMode): void {
    item.spliting = mode; // 记录当前分裂模式
    item.splitingItemComponent = overItem; // 记录分裂谁
    switch (mode) {
      case GridsterItemSplitMode.up: // 上
        item.x = overItem.$item.x;
        item.y = overItem.$item.y;
        item.rows = Math.floor(overItem.$item.rows / 2);
        item.cols = overItem.$item.cols;
        break;
      case GridsterItemSplitMode.down: // 下
        item.x = overItem.$item.x;
        item.y = Math.ceil(overItem.$item.y + overItem.$item.rows / 2);
        item.rows = Math.floor(overItem.$item.rows / 2);
        item.cols = overItem.$item.cols;
        break;
      case GridsterItemSplitMode.left: // 左
        item.x = overItem.$item.x;
        item.y = overItem.$item.y;
        item.rows = overItem.$item.rows;
        item.cols = Math.floor(overItem.$item.cols / 2);
        break;
      case GridsterItemSplitMode.right: // 右
        item.x = Math.ceil(overItem.$item.x + overItem.$item.cols / 2);
        item.y = overItem.$item.y;
        item.rows = overItem.$item.rows;
        item.cols = Math.floor(overItem.$item.cols / 2);
        break;
    }
  }
  /** 找出参照物 */
  checkdReferenceItem(checkItem: GridsterItem, pos: string): GridsterItemComponentInterface | undefined {
    let findItem = this.gridster.findItemWithItem(checkItem);
    if (!findItem) {
      switch (pos) {
        case 'left':
          if (checkItem.x <= 1) return undefined;
          checkItem.x -= 1;
          break;
        case 'right':
          if (checkItem.x >= this.gridster.$options.maxCols) return undefined;
          checkItem.x += 1;
          break;
        case 'top':
          if (checkItem.y <= 1) return undefined;
          checkItem.y -= 1;
          break;
        case 'bottom':
          if (checkItem.y >= this.gridster.$options.maxRows) return undefined;
          checkItem.y += 1;
          break;
        default:
          return undefined;
      }
      findItem = this.checkdReferenceItem(checkItem, pos) || false;
    }
    return findItem ? <GridsterItemComponentInterface>findItem : undefined;
  }
  fitByReferenceItem(updateItem: GridsterItem, leftReferenceItem: GridsterItemComponentInterface, rightReferenceItem: GridsterItemComponentInterface): boolean {
    if (leftReferenceItem && !rightReferenceItem) { // 只有左边有参照物
      if (this.gridster.$options.minItemRows > leftReferenceItem.$item.rows) return false; // 高度不够
      if (this.gridster.$options.minItemCols > this.gridster.$options.maxCols - leftReferenceItem.$item.x - leftReferenceItem.$item.cols) return false; // 宽度不够
      updateItem.x = leftReferenceItem.$item.x + leftReferenceItem.$item.cols;
      updateItem.y = leftReferenceItem.$item.y;
      updateItem.rows = leftReferenceItem.$item.rows;
      updateItem.cols = this.gridster.$options.maxCols - leftReferenceItem.$item.x - leftReferenceItem.$item.cols;
    } else if (!leftReferenceItem && rightReferenceItem) { // 只有右边有参照物
      if (this.gridster.$options.minItemRows > rightReferenceItem.$item.rows) return false; // 高度不够
      if (this.gridster.$options.minItemCols > rightReferenceItem.$item.x) return false; // 宽度不够
      updateItem.x = 0;
      updateItem.y = rightReferenceItem.$item.y;
      updateItem.rows = rightReferenceItem.$item.rows;
      updateItem.cols = rightReferenceItem.$item.x;
    } else if (leftReferenceItem && rightReferenceItem) { // 两边都有参照物
      if (this.gridster.$options.minItemRows > leftReferenceItem.$item.rows) return false; // 高度不够
      if (this.gridster.$options.minItemCols > rightReferenceItem.$item.x - leftReferenceItem.$item.x - leftReferenceItem.$item.cols) return false; // 宽度不够
      updateItem.x = leftReferenceItem.$item.x + leftReferenceItem.$item.cols;
      updateItem.y = leftReferenceItem.$item.y;
      updateItem.rows = leftReferenceItem.$item.rows;
      updateItem.cols = rightReferenceItem.$item.x - leftReferenceItem.$item.x - leftReferenceItem.$item.cols;
    }
    return true;
  }
}
