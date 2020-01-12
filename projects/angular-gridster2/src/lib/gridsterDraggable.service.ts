import {Injectable, NgZone} from '@angular/core';

import {GridsterSwap} from './gridsterSwap.service';
import {cancelScroll, scroll} from './gridsterScroll.service';
import {GridsterPush} from './gridsterPush.service';
import {GridsterUtils} from './gridsterUtils.service';
import {GridsterItemComponentInterface} from './gridsterItemComponent.interface';
import {GridsterComponentInterface} from './gridster.interface';

@Injectable()
export class GridsterDraggable {
  gridsterItem: GridsterItemComponentInterface;
  gridster: GridsterComponentInterface;
  lastMouse: {
    clientX: number,
    clientY: number
  };
  /** 鼠标在所在的X坐标位置 */
  mouseOffsetX: number;
  /** 鼠标所在的Y坐标位置 */
  mouseOffsetY: number;
  offsetLeft: number;
  offsetTop: number;
  margin: number;
  diffTop: number;
  diffLeft: number;
  top: number;
  left: number;
  height: number;
  width: number;
  positionX: number;
  positionY: number;
  positionXBackup: number;
  positionYBackup: number;
  enabled: boolean;
  dragStartFunction: (event: any) => void;
  dragFunction: (event: any) => void;
  dragStopFunction: (event: any) => void;
  mousemove: Function;
  mouseup: Function;
  mouseleave: Function;
  cancelOnBlur: Function;
  touchmove: Function;
  touchend: Function;
  touchcancel: Function;
  mousedown: Function;
  touchstart: Function;
  push: GridsterPush;
  swap: GridsterSwap;
  path: Array<{ x: number, y: number }>;
  collision: GridsterItemComponentInterface | boolean = false;

  constructor(gridsterItem: GridsterItemComponentInterface, gridster: GridsterComponentInterface, private zone: NgZone) {
    this.gridsterItem = gridsterItem;
    this.gridster = gridster;
    this.lastMouse = {
      clientX: 0,
      clientY: 0
    };
    this.path = [];
  }

  destroy(): void {
    // 堆叠模式下无需预览放置效果
    if (this.gridster.previewStyle && !this.gridster.$options.draggable.dropOverItemStack) {
      this.gridster.previewStyle(true);
    }
    delete this.gridsterItem;
    delete this.gridster;
    delete this.collision;
    if (this.mousedown) {
      this.mousedown();
      this.touchstart();
    }
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

    if (this.gridster.options.draggable && this.gridster.options.draggable.start) {
      this.gridster.options.draggable.start(this.gridsterItem.item, this.gridsterItem, e);
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
    this.gridsterItem.renderer.addClass(this.gridsterItem.el, 'gridster-item-moving');
    this.margin = this.gridster.$options.margin;
    this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
    this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
    this.left = this.gridsterItem.left - this.margin;
    this.top = this.gridsterItem.top - this.margin;
    this.width = this.gridsterItem.width;
    this.height = this.gridsterItem.height;
    
    // 这里记录鼠标的位置，堆叠模式下会用到
    this.mouseOffsetX = e.offsetX;
    this.mouseOffsetY = e.offsetY;
    this.diffLeft = e.clientX + this.offsetLeft - this.margin - this.left;
    this.diffTop = e.clientY + this.offsetTop - this.margin - this.top;
    this.gridster.movingItem = this.gridsterItem.$item;
    if (!this.gridster.$options.draggable.dropOverItemStack) {   // 堆叠模式下无需预览放置效果
      this.gridster.previewStyle(true);
    }
    this.push = new GridsterPush(this.gridsterItem);
    this.swap = new GridsterSwap(this.gridsterItem);
    this.gridster.dragInProgress = true;
    this.gridster.updateGrid();
    this.path.push({x: this.gridsterItem.item.x || 0, y: this.gridsterItem.item.y || 0});
    
    // 拖拽时要确保当前拖拽的item在最上面
    this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'z-index', 9999);
  }

  dragMove(e: any): void {
    e.stopPropagation();
    e.preventDefault();
    GridsterUtils.checkTouchEvent(e);
    this.offsetLeft = this.gridster.el.scrollLeft - this.gridster.el.offsetLeft;
    this.offsetTop = this.gridster.el.scrollTop - this.gridster.el.offsetTop;
    scroll(this.gridster, this.left, this.top, this.width, this.height, e, this.lastMouse,
      this.calculateItemPositionFromMousePosition.bind(this));
    this.calculateItemPositionFromMousePosition(e);
  }

  calculateItemPositionFromMousePosition(e: any): void {
    if (!this.gridster.$options.draggable.dropOverItemStack) {
      this.left = e.clientX + this.offsetLeft - this.diffLeft;
      this.top = e.clientY + this.offsetTop - this.diffTop;
    } else {
      // 堆叠模式下位置的计算跟原来的有所不同，需要重新计算
      this.left = e.clientX - this.gridster.el.offsetLeft - this.mouseOffsetX - this.margin - this.gridster.el.scrollLeft;
      this.top = e.clientY - this.mouseOffsetY - this.margin + (this.gridster.el.parentElement.scrollTop + this.offsetTop);
    }
    this.calculateItemPosition();
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
    this.cancelOnBlur();
    this.mousemove();
    this.mouseup();
    this.mouseleave();
    this.touchmove();
    this.touchend();
    this.touchcancel();
    this.gridsterItem.renderer.removeClass(this.gridsterItem.el, 'gridster-item-moving');
    this.gridster.dragInProgress = false;
    this.gridster.updateGrid();
    this.path = [];
    if (this.gridster.options.draggable && this.gridster.options.draggable.stop) {
      if (!this.gridster.$options.draggable.dropOverItemStack) {
        Promise.resolve(this.gridster.options.draggable.stop(this.gridsterItem.item, this.gridsterItem, e))
          .then(this.makeDrag.bind(this), this.cancelDrag.bind(this));
      } else {
        // 堆叠模式下，停止拖拽时无需考虑其他item的大小位置，也不能影响到其他item，所以无需执行makeDrag和cancelDrag方法
        Promise.resolve(this.gridster.options.draggable.stop(this.gridsterItem.item, this.gridsterItem, e))
      }
    } else {
      this.makeDrag();
    }
    setTimeout(() => {
      if (this.gridster) {
        this.gridster.movingItem = null;
        if (!this.gridster.$options.draggable.dropOverItemStack) {   // 堆叠模式下无需预览放置效果
          this.gridster.previewStyle(true);
        }
      }
    });
    // 停止拖拽时，如果设置了item的z-index，此时应将z-index从9999改回原值，如果没设置，默认为1
    this.gridsterItem.renderer.setStyle(this.gridsterItem.el, 'z-index', this.gridsterItem.item.zIndex || 1);
  }

  cancelDrag() {
    this.gridsterItem.$item.x = this.gridsterItem.item.x || 0;
    this.gridsterItem.$item.y = this.gridsterItem.item.y || 0;
    this.gridsterItem.setSize();
    if (this.push) {
      this.push.restoreItems();
    }
    if (this.swap) {
      this.swap.restoreSwapItem();
    }
    if (this.push) {
      this.push.destroy();
      delete this.push;
    }
    if (this.swap) {
      this.swap.destroy();
      delete this.swap;
    }
  }

  makeDrag() {
    if (this.gridster.$options.draggable.dropOverItems && this.gridster.options.draggable
      && this.gridster.options.draggable.dropOverItemsCallback
      && this.collision && this.collision !== true && this.collision.$item) {
      this.gridster.options.draggable.dropOverItemsCallback(this.gridsterItem.item, this.collision.item, this.gridster);
    }
    this.collision = false;
    this.gridsterItem.setSize();
    this.gridsterItem.checkItemChanges(this.gridsterItem.$item, this.gridsterItem.item);
    if (this.push) {
      this.push.setPushedItems();
    }
    if (this.swap) {
      this.swap.setSwapItem();
    }
    if (this.push) {
      this.push.destroy();
      delete this.push;
    }
    if (this.swap) {
      this.swap.destroy();
      delete this.swap;
    }
  }

  calculateItemPosition() {
    this.gridster.movingItem = this.gridsterItem.$item;
    this.positionX = this.gridster.pixelsToPositionX(this.left, Math.round);
    this.positionY = this.gridster.pixelsToPositionY(this.top, Math.round);
    this.positionXBackup = this.gridsterItem.$item.x;
    this.positionYBackup = this.gridsterItem.$item.y;
    this.gridsterItem.$item.x = this.positionX;
    if (this.gridster.checkGridCollision(this.gridsterItem.$item)) {
      this.gridsterItem.$item.x = this.positionXBackup;
    }
    this.gridsterItem.$item.y = this.positionY;
    if (this.gridster.checkGridCollision(this.gridsterItem.$item)) {
      this.gridsterItem.$item.y = this.positionYBackup;
    }
    if (this.gridster.$options.draggable.dropOverItemStack) {
      // 这里是限制item的拖放不能超出左、上两处边缘，同理可以根据业务需要限制右、下两处，这里暂不限制
      if (this.left < 0) this.left = 0;
      if (this.top < 0) this.top = 0;

      // 下面的代码如果启用，则会限制item不能超出右、下边缘
      if (this.gridsterItem.$item.left && this.gridsterItem.el.clientWidth && (this.left + this.gridsterItem.el.clientWidth >= (this.gridster.curWidth - this.margin))) {
        this.left = this.gridsterItem.$item.left = this.gridster.curWidth - this.margin - this.gridsterItem.el.clientWidth;
      }
      if (this.gridsterItem.$item.top && this.gridsterItem.el.clientHeight && (this.top + this.gridsterItem.el.clientHeight >= (this.gridster.curHeight - this.margin))) {
        this.top = this.gridsterItem.$item.top = this.gridster.curHeight - this.margin - this.gridsterItem.el.clientHeight;
      }
    }
    this.gridster.gridRenderer.setCellPosition(this.gridsterItem.renderer, this.gridsterItem.el, this.left, this.top);

    if (this.positionXBackup !== this.gridsterItem.$item.x || this.positionYBackup !== this.gridsterItem.$item.y) {
      const lastPosition = this.path[this.path.length - 1];
      let direction = '';
      if (lastPosition.x < this.gridsterItem.$item.x) {
        direction = this.push.fromWest;
      } else if (lastPosition.x > this.gridsterItem.$item.x) {
        direction = this.push.fromEast;
      } else if (lastPosition.y < this.gridsterItem.$item.y) {
        direction = this.push.fromNorth;
      } else if (lastPosition.y > this.gridsterItem.$item.y) {
        direction = this.push.fromSouth;
      }
      this.push.pushItems(direction, this.gridster.$options.disablePushOnDrag);
      this.swap.swapItems();
      this.collision = this.gridster.checkCollision(this.gridsterItem.$item);
      if (this.collision) {
        this.gridsterItem.$item.x = this.positionXBackup;
        this.gridsterItem.$item.y = this.positionYBackup;
        if (this.gridster.$options.draggable.dropOverItems && this.collision !== true && this.collision.$item) {
          this.gridster.movingItem = null;
        }
      } else {
        this.path.push({x: this.gridsterItem.$item.x, y: this.gridsterItem.$item.y});
      }
      this.push.checkPushBack();
    }
    if (!this.gridster.$options.draggable.dropOverItemStack) {   // 堆叠模式下无需预览放置效果
      this.gridster.previewStyle(true);
    }
  }

  toggle() {
    const enableDrag = this.gridsterItem.canBeDragged();
    if (!this.enabled && enableDrag) {
      this.enabled = !this.enabled;
      this.dragStartFunction = this.dragStartDelay.bind(this);
      this.mousedown = this.gridsterItem.renderer.listen(this.gridsterItem.el, 'mousedown', this.dragStartFunction);
      this.touchstart = this.gridsterItem.renderer.listen(this.gridsterItem.el, 'touchstart', this.dragStartFunction);
    } else if (this.enabled && !enableDrag) {
      this.enabled = !this.enabled;
      this.mousedown();
      this.touchstart();
    }
  }

  dragStartDelay(e: any): void {
    if (e.target.hasAttribute('class') && e.target.getAttribute('class').split(' ').indexOf('gridster-item-resizable-handler') > -1) {
      return;
    }
    if (GridsterUtils.checkContentClassForEvent(this.gridster, e)) {
      return;
    }
    GridsterUtils.checkTouchEvent(e);
    if (!this.gridster.$options.draggable.delayStart) {
      this.dragStart(e);
      return;
    }
    const timeout = setTimeout(() => {
      this.dragStart(e);
      cancelDrag();
    }, this.gridster.$options.draggable.delayStart);
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
}
