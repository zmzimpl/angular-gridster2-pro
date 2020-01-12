import {Injectable, NgZone} from '@angular/core';

import {cancelScroll, scroll} from './gridsterScroll.service';
import {GridsterResizeEventType} from './gridsterResizeEventType.interface';
import {GridsterPush} from './gridsterPush.service';
import {GridsterUtils} from './gridsterUtils.service';
import {GridsterPushResize} from './gridsterPushResize.service';
import {GridsterItemComponentInterface} from './gridsterItemComponent.interface';
import {GridsterComponentInterface} from './gridster.interface';

@Injectable()
export class GridsterResizable {
  gridsterItem: GridsterItemComponentInterface;
  gridster: GridsterComponentInterface;
  lastMouse: {
    clientX: number,
    clientY: number
  };
  itemBackup: Array<number>;
  resizeEventScrollType: GridsterResizeEventType;
  directionFunction: Function;
  dragFunction: (event: any) => void;
  dragStopFunction: (event: any) => void;
  resizeEnabled: boolean;
  mousemove: Function;
  mouseup: Function;
  mouseleave: Function;
  cancelOnBlur: Function;
  touchmove: Function;
  touchend: Function;
  touchcancel: Function;
  push: GridsterPush;
  pushResize: GridsterPushResize;
  minHeight: number;
  minWidth: number;
  offsetTop: number;
  offsetLeft: number;
  diffTop: number;
  diffLeft: number;
  diffRight: number;
  diffBottom: number;
  margin: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
  newPosition: number;

  /** 堆叠模式下记录鼠标X坐标位置 */
  mouseOffsetX: number;
  /** 堆叠模式下记录鼠标Y坐标位置 */
  mouseOffsetY: number;
  /** 堆叠模式下第一次调整大小，会受边距影响有所偏移，通过这个字段来标识并对偏移量进行处理 */
  firstResize = true;

  constructor(gridsterItem: GridsterItemComponentInterface, gridster: GridsterComponentInterface, private zone: NgZone) {
    this.gridsterItem = gridsterItem;
    this.gridster = gridster;
    this.lastMouse = {
      clientX: 0,
      clientY: 0
    };
    this.itemBackup = [0, 0, 0, 0];
    this.resizeEventScrollType = {w: false, e: false, n: false, s: false};
  }

  destroy(): void {
    if (this.gridster.previewStyle && !this.gridster.$options.draggable.dropOverItemStack) {
      this.gridster.previewStyle();
    }
    delete this.gridsterItem;
    delete this.gridster;
  }

  dragStart(e: any): void {
    switch (e.which) {
      case 1:
        // left mouse button
        break;
      case 2:
      case 3:
        // right or middle mouse button
        return;
    }
    if (this.gridster.options.resizable && this.gridster.options.resizable.start) {
      this.gridster.options.resizable.start(this.gridsterItem.item, this.gridsterItem, e);
    }
    e.stopPropagation();
    e.preventDefault();
    this.dragFunction = this.dragMove.bind(this);
    this.dragStopFunction = this.dragStop.bind(this);
    this.zone.runOutsideAngular(() => {
      this.mousemove = this.gridsterItem.renderer.listen('document', 'mousemove', this.dragFunction);
      this.touchmove = this.gridster.renderer.listen(this.gridster.el, 'touchmove', this.dragFunction);
    });
    this.mouseup = this.gridsterItem.renderer.listen('document', 'mouseup', this.dragStopFunction);
    this.mouseleave = this.gridsterItem.renderer.listen('document', 'mouseleave', this.dragStopFunction);
    this.cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', this.dragStopFunction);
    this.touchend = this.gridsterItem.renderer.listen('document', 'touchend', this.dragStopFunction);
    this.touchcancel = this.gridsterItem.renderer.listen('document', 'touchcancel', this.dragStopFunction);

    this.gridsterItem.renderer.addClass(this.gridsterItem.el, 'gridster-item-resizing');
    this.lastMouse.clientX = e.clientX;
    this.lastMouse.clientY = e.clientY;
    this.margin = this.gridster.$options.margin;
    if (this.gridster.$options.draggable.dropOverItemStack && this.firstResize) {
      // 堆叠模式下第一次调整大小时，会受外边距影响导致item有所偏移，这里对其单独处理
      this.left = this.gridsterItem.left - this.margin;
      this.top = this.gridsterItem.top - this.margin;
      this.firstResize = false;
    } else {
      this.left = this.gridsterItem.left;
      this.top = this.gridsterItem.top;
    }
    // 堆叠模式下，直接应用元素的宽、高
    this.width = this.gridster.$options.draggable.dropOverItemStack ? this.gridsterItem.el.clientWidth : this.gridsterItem.width;
    this.height = this.gridster.$options.draggable.dropOverItemStack ? this.gridsterItem.el.clientHeight : this.gridsterItem.height;
    this.bottom = this.top + this.height;
    this.right = this.left + this.width;
    this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
    this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
    this.diffLeft = e.clientX + this.offsetLeft - this.left;
    this.diffRight = e.clientX + this.offsetLeft - this.right;
    this.diffTop = e.clientY + this.offsetTop - this.top;
    this.diffBottom = e.clientY + this.offsetTop - this.bottom;
    this.minHeight = this.gridster.positionYToPixels(this.gridsterItem.$item.minItemRows || this.gridster.$options.minItemRows)
      - this.margin;
    this.minWidth = this.gridster.positionXToPixels(this.gridsterItem.$item.minItemCols || this.gridster.$options.minItemCols)
      - this.margin;
    this.gridster.movingItem = this.gridsterItem.$item;
    if (!this.gridster.$options.draggable.dropOverItemStack) {
      this.gridster.previewStyle();
    }
    this.push = new GridsterPush(this.gridsterItem);
    this.pushResize = new GridsterPushResize(this.gridsterItem);
    this.gridster.dragInProgress = true;
    this.gridster.updateGrid();

    if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('handle-n') > -1) {
      this.resizeEventScrollType.n = true;
      this.directionFunction = this.handleN;
    } else if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('handle-w') > -1) {
      this.resizeEventScrollType.w = true;
      this.directionFunction = this.handleW;
    } else if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('handle-s') > -1) {
      this.resizeEventScrollType.s = true;
      this.directionFunction = this.handleS;
    } else if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('handle-e') > -1) {
      this.resizeEventScrollType.e = true;
      this.directionFunction = this.handleE;
    } else if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('handle-nw') > -1) {
      this.resizeEventScrollType.n = true;
      this.resizeEventScrollType.w = true;
      this.directionFunction = this.handleNW;
    } else if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('handle-ne') > -1) {
      this.resizeEventScrollType.n = true;
      this.resizeEventScrollType.e = true;
      this.directionFunction = this.handleNE;
    } else if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('handle-sw') > -1) {
      this.resizeEventScrollType.s = true;
      this.resizeEventScrollType.w = true;
      this.directionFunction = this.handleSW;
    } else if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('handle-se') > -1) {
      this.resizeEventScrollType.s = true;
      this.resizeEventScrollType.e = true;
      this.directionFunction = this.handleSE;
    }
    // 调整大小时，也要保证item不被其他元素遮挡
    this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'z-index', 9999);
  }

  dragMove(e: any): void {
    e.stopPropagation();
    e.preventDefault();
    GridsterUtils.checkTouchEvent(e);
    this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
    this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
    scroll(this.gridster, this.left, this.top, this.width, this.height, e, this.lastMouse, this.directionFunction.bind(this), true,
      this.resizeEventScrollType);
    this.directionFunction(e);

    this.lastMouse.clientX = e.clientX;
    this.lastMouse.clientY = e.clientY;
    this.zone.run(() => {
      this.gridster.updateGrid();
    });
  }

  dragStop(e: any): void {
    e.stopPropagation();
    e.preventDefault();
    cancelScroll();
    this.mousemove();
    this.mouseup();
    this.mouseleave();
    this.cancelOnBlur();
    this.touchmove();
    this.touchend();
    this.touchcancel();
    this.gridster.dragInProgress = false;
    this.gridster.updateGrid();
    if (!this.gridster.$options.draggable.dropOverItemStack) {
      if (this.gridster.options.resizable && this.gridster.options.resizable.stop) {
        Promise.resolve(this.gridster.options.resizable.stop(this.gridsterItem.item, this.gridsterItem, e))
          .then(this.makeResize.bind(this), this.cancelResize.bind(this));
      } else {
        this.makeResize();
      }
    } else {
      // 堆叠模式下
      if (this.gridster.options.resizable && this.gridster.options.resizable.stop) {
        // 如果定义了调整大小后的回调函数，则先调用后设置宽、高
        Promise.resolve(this.gridster.options.resizable.stop(this.gridsterItem.item, this.gridsterItem, e))
          .then(this.setItemHeight.bind(this, this.gridsterItem.el.height), this.setItemWidth.bind(this, this.gridsterItem.el.width));
      } else {
        // 如果没有定义回调函数，直接设置宽、高
        this.setItemHeight(this.gridsterItem.el.height);
        this.setItemWidth(this.gridsterItem.el.width);
      }
    }
    setTimeout(() => {
      this.gridsterItem.renderer.removeClass(this.gridsterItem.el, 'gridster-item-resizing');
      if (this.gridster) {
        this.gridster.movingItem = null;
        if (!this.gridster.$options.draggable.dropOverItemStack) {
          this.gridster.previewStyle();
        }
      }
    });
    // 堆叠模式下要把宽、高存起来
    if (this.gridster.$options.draggable.dropOverItemStack) {
      Object.assign(this.gridsterItem.item, { width: this.gridsterItem.el.clientWidth, height: this.gridsterItem.el.clientHeight });
      Object.assign(this.gridsterItem.$item, { width: this.gridsterItem.el.clientWidth, height: this.gridsterItem.el.clientHeight });
    }
    // 恢复z-index
    this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'z-index', this.gridsterItem.item.zIndex || 1);
  }

  cancelResize(): void {
    this.gridsterItem.$item.cols = this.gridsterItem.item.cols || 1;
    this.gridsterItem.$item.rows = this.gridsterItem.item.rows || 1;
    this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
    this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
    this.gridsterItem.setSize();
    this.push.restoreItems();
    this.pushResize.restoreItems();
    this.push.destroy();
    delete this.push;
    this.pushResize.destroy();
    delete this.pushResize;
  }

  makeResize(): void {
    this.gridsterItem.setSize();
    this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
    this.push.setPushedItems();
    this.pushResize.setPushedItems();
    this.push.destroy();
    delete this.push;
    this.pushResize.destroy();
    delete this.pushResize;
  }

  handleN(e: any): void {
    this.top = e.clientY + this.offsetTop - this.diffTop;
    this.height = this.bottom - this.top;
    if (this.minHeight > this.height) {
      this.height = this.minHeight;
      this.top = this.bottom - this.minHeight;
    }
    this.newPosition = this.gridster.pixelsToPositionY(this.top + this.margin, Math.floor);
    if (this.gridsterItem.$item.y !== this.newPosition) {
      this.itemBackup[1] = this.gridsterItem.$item.y;
      this.itemBackup[3] = this.gridsterItem.$item.rows;
      this.gridsterItem.$item.rows += this.gridsterItem.$item.y - this.newPosition;
      this.gridsterItem.$item.y = this.newPosition;
      this.pushResize.pushItems(this.pushResize.fromSouth);
      this.push.pushItems(this.push.fromSouth, this.gridster.$options.disablePushOnResize);
      // 非堆叠模式下要校验单元格位置冲突
      if (!this.gridster.$options.draggable.dropOverItemStack && this.gridster.checkCollision(this.gridsterItem.$item)) {
        this.gridsterItem.$item.y = this.itemBackup[1];
        this.gridsterItem.$item.rows = this.itemBackup[3];
        this.setItemTop(this.gridster.positionYToPixels(this.gridsterItem.$item.y));
        this.setItemHeight(this.gridster.positionYToPixels(this.gridsterItem.$item.rows) - this.margin);
        return;
      } else {
        if (!this.gridster.$options.draggable.dropOverItemStack) {
          this.gridster.previewStyle();
        }
      }
      this.pushResize.checkPushBack();
      this.push.checkPushBack();
    }
    this.setItemTop(this.top);
    this.setItemHeight(this.height);
  }

  handleW(e: any): void {
    this.left = e.clientX + this.offsetLeft - this.diffLeft;
    this.width = this.right - this.left;
    if (this.minWidth > this.width) {
      this.width = this.minWidth;
      this.left = this.right - this.minWidth;
    }
    this.newPosition = this.gridster.pixelsToPositionX(this.left + this.margin, Math.floor);
    if (this.gridsterItem.$item.x !== this.newPosition) {
      this.itemBackup[0] = this.gridsterItem.$item.x;
      this.itemBackup[2] = this.gridsterItem.$item.cols;
      this.gridsterItem.$item.cols += this.gridsterItem.$item.x - this.newPosition;
      this.gridsterItem.$item.x = this.newPosition;
      this.pushResize.pushItems(this.pushResize.fromEast);
      this.push.pushItems(this.push.fromEast, this.gridster.$options.disablePushOnResize);
      // 非堆叠模式下要校验单元格位置冲突
      if (!this.gridster.$options.draggable.dropOverItemStack && this.gridster.checkCollision(this.gridsterItem.$item)) {
        this.gridsterItem.$item.x = this.itemBackup[0];
        this.gridsterItem.$item.cols = this.itemBackup[2];
        this.setItemLeft(this.gridster.positionXToPixels(this.gridsterItem.$item.x));
        this.setItemWidth(this.gridster.positionXToPixels(this.gridsterItem.$item.cols) - this.margin);
        return;
      } else {
        if (!this.gridster.$options.draggable.dropOverItemStack) {
          this.gridster.previewStyle();
        }
      }
      this.pushResize.checkPushBack();
      this.push.checkPushBack();
    }
    this.setItemLeft(this.left);
    this.setItemWidth(this.width);
  }

  handleS(e: any): void {
    this.height = e.clientY + this.offsetTop - this.diffBottom - this.top;
    if (this.minHeight > this.height) {
      this.height = this.minHeight;
    }
    if (this.height + this.top > this.gridster.curHeight) {
      this.height = this.gridster.curHeight - this.top - this.margin;
    }
    this.bottom = this.top + this.height;
    this.newPosition = this.gridster.pixelsToPositionY(this.bottom, Math.ceil);
    if ((this.gridsterItem.$item.y + this.gridsterItem.$item.rows) !== this.newPosition) {
      this.itemBackup[3] = this.gridsterItem.$item.rows;
      this.gridsterItem.$item.rows = this.newPosition - this.gridsterItem.$item.y;
      this.pushResize.pushItems(this.pushResize.fromNorth);
      this.push.pushItems(this.push.fromNorth, this.gridster.$options.disablePushOnResize);
      // 非堆叠模式下要校验单元格位置冲突
      if (!this.gridster.$options.draggable.dropOverItemStack && this.gridster.checkCollision(this.gridsterItem.$item)) {
        this.gridsterItem.$item.rows = this.itemBackup[3];
        this.setItemHeight(this.gridster.positionYToPixels(this.gridsterItem.$item.rows) - this.margin);
        return;
      } else {
        if (!this.gridster.$options.draggable.dropOverItemStack) {
          this.gridster.previewStyle();
        }
      }
      this.pushResize.checkPushBack();
      this.push.checkPushBack();
    }
    this.setItemHeight(this.height);
  }

  handleE(e: any): void {
    this.width = e.clientX + this.offsetLeft - this.diffRight - this.left;
    if (this.minWidth > this.width) {
      this.width = this.minWidth;
    }
    if (this.width + this.left > this.gridster.curWidth) {
      this.width = this.gridster.curWidth - this.left - this.margin;
    }
    this.right = this.left + this.width;
    this.newPosition = this.gridster.pixelsToPositionX(this.right, Math.ceil);
    if ((this.gridsterItem.$item.x + this.gridsterItem.$item.cols) !== this.newPosition) {
      this.itemBackup[2] = this.gridsterItem.$item.cols;
      this.gridsterItem.$item.cols = this.newPosition - this.gridsterItem.$item.x;
      this.pushResize.pushItems(this.pushResize.fromWest);
      this.push.pushItems(this.push.fromWest, this.gridster.$options.disablePushOnResize);
      // 非堆叠模式下要校验单元格位置冲突
      if (!this.gridster.$options.draggable.dropOverItemStack && this.gridster.checkCollision(this.gridsterItem.$item)) {
        this.gridsterItem.$item.cols = this.itemBackup[2];
        this.setItemWidth(this.gridster.positionXToPixels(this.gridsterItem.$item.cols) - this.margin);
        return;
      } else {
        if (!this.gridster.$options.draggable.dropOverItemStack) {
          this.gridster.previewStyle();
        }
      }
      this.pushResize.checkPushBack();
      this.push.checkPushBack();
    }
    this.setItemWidth(this.width);
  }

  handleNW(e: any): void {
    this.handleN(e);
    this.handleW(e);
  }

  handleNE(e: any): void {
    this.handleN(e);
    this.handleE(e);
  }

  handleSW(e: any): void {
    this.handleS(e);
    this.handleW(e);
  }

  handleSE(e: any): void {
    this.handleS(e);
    this.handleE(e);
  }

  toggle(): void {
    this.resizeEnabled = this.gridsterItem.canBeResized();
  }

  dragStartDelay(e: any): void {
    GridsterUtils.checkTouchEvent(e);
    if (!this.gridster.$options.resizable.delayStart) {
      this.dragStart(e);
      return;
    }
    const timeout = setTimeout(() => {
      this.dragStart(e);
      cancelDrag();
    }, this.gridster.$options.resizable.delayStart);
    const cancelMouse = this.gridsterItem.renderer.listen('document', 'mouseup', cancelDrag);
    const cancelMouseLeave = this.gridsterItem.renderer.listen('document', 'mouseleave', cancelDrag);
    const cancelOnBlur = this.gridsterItem.renderer.listen('window', 'blur', cancelDrag);
    const cancelTouchMove = this.gridsterItem.renderer.listen('document', 'touchmove', cancelMove);
    const cancelTouchEnd = this.gridsterItem.renderer.listen('document', 'touchend', cancelDrag);
    const cancelTouchCancel = this.gridsterItem.renderer.listen('document', 'touchcancel', cancelDrag);

    function cancelMove(eventMove: any) {
      GridsterUtils.checkTouchEvent(eventMove);
      if (Math.abs(eventMove.clientX - e.clientX) > 9 || Math.abs(eventMove.clientY - e.clientY) > 9) {
        cancelDrag();
      }
    }

    function cancelDrag() {
      clearTimeout(timeout);
      cancelOnBlur();
      cancelMouse();
      cancelMouseLeave();
      cancelTouchMove();
      cancelTouchEnd();
      cancelTouchCancel();
    }
  }

  setItemTop(top: number): void {
    this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, this.left, top);
    if (this.gridster.$options.draggable.dropOverItemStack) {
      // 保存位置信息
      Object.assign(this.gridsterItem, { top, left: this.left });
    }
  }

  setItemLeft(left: number): void {
    this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, left, this.top);
    if (this.gridster.$options.draggable.dropOverItemStack) {
      // 保存位置信息
      Object.assign(this.gridsterItem, { left, top: this.top });
    }
  }

  setItemHeight(height: number): void {
    this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'height', height + 'px');
  }

  setItemWidth(width: number): void {
    this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'width', width + 'px');
  }
}
