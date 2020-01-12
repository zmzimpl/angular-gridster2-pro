import {Component, ElementRef, Host, Input, NgZone, OnDestroy, OnInit, Renderer2, ViewEncapsulation, Inject} from '@angular/core';

import {GridsterItem} from './gridsterItem.interface';
import {GridsterDraggable} from './gridsterDraggable.service';
import {GridsterResizable} from './gridsterResizable.service';
import {GridsterUtils} from './gridsterUtils.service';
import {GridsterItemComponentInterface} from './gridsterItemComponent.interface';
import {GridsterComponent} from './gridster.component';

@Component({
  selector: 'gridster-item',
  templateUrl: './gridsterItem.html',
  styleUrls: ['./gridsterItem.css'],
  encapsulation: ViewEncapsulation.None
})
export class GridsterItemComponent implements OnInit, OnDestroy, GridsterItemComponentInterface {
  @Input() item: GridsterItem;
  $item: GridsterItem;
  el: any;
  gridster: GridsterComponent;
  top: number;
  left: number;
  width: number;
  height: number;
  drag: GridsterDraggable;
  resize: GridsterResizable;
  notPlaced: boolean;
  init: boolean;

  constructor(@Inject(ElementRef) el: ElementRef,  gridster: GridsterComponent, @Inject(Renderer2) public renderer: Renderer2, @Inject(NgZone) private zone: NgZone) {
    this.el = el.nativeElement;
    this.$item = {
      cols: -1,
      rows: -1,
      x: -1,
      y: -1,
    };
    this.gridster = gridster;
    this.drag = new GridsterDraggable(this, gridster, this.zone);
    this.resize = new GridsterResizable(this, gridster, this.zone);
  }

  ngOnInit(): void {
    this.updateOptions();
    this.gridster.addItem(this);
  }

  updateOptions(): void {
    this.$item = GridsterUtils.merge(this.$item, this.item, {
      cols: undefined,
      rows: undefined,
      x: undefined,
      y: undefined,
      dragEnabled: undefined,
      resizeEnabled: undefined,
      compactEnabled: undefined,
      maxItemRows: undefined,
      minItemRows: undefined,
      maxItemCols: undefined,
      minItemCols: undefined,
      maxItemArea: undefined,
      minItemArea: undefined,
      
      // 以下5个属性主要用于堆叠模式
      left: undefined,
      top: undefined,
      zIndex: undefined,
      width: undefined,
      height: undefined
    });
  }

  ngOnDestroy(): void {
    this.gridster.removeItem(this);
    delete this.gridster;
    this.drag.destroy();
    delete this.drag;
    this.resize.destroy();
    delete this.resize;
  }

  setSize(): void {
    this.renderer.setStyle(this.el, 'display', this.notPlaced ? '' : 'block');
    this.gridster.gridRenderer.updateItem(this.el, this.$item, this.renderer);
    this.updateItemSize();
  }

  updateItemSize() {
    let top = 0;
    let left = 0;
    let width = this.gridster.curColWidth;
    let height = this.gridster.curRowHeight;
    if (this.gridster.$options.draggable.dropOverItemStack) {
    // 如果是堆叠模式，并且item设置了top 和 left 信息，则应该应用其所拥有的值，如果没有设置，才去计算
      top = this.$item.top !== undefined ? this.$item.top : this.$item.y * this.gridster.curRowHeight;
      left = this.$item.left !== undefined ? this.$item.left : this.$item.x * this.gridster.curColWidth;
      width = this.$item.width !== undefined ? this.$item.width : this.$item.cols * this.gridster.curColWidth - this.gridster.$options.margin;
      height = this.$item.height !== undefined ? this.$item.height : this.$item.cols * this.gridster.curRowHeight - this.gridster.$options.margin;
    } else {
      top = this.$item.y * this.gridster.curRowHeight;
      left = this.$item.x * this.gridster.curColWidth;
      width = this.$item.cols * this.gridster.curColWidth - this.gridster.$options.margin;
      height = this.$item.rows * this.gridster.curRowHeight - this.gridster.$options.margin;
    }

    if (!this.init && width > 0 && height > 0) {
      this.init = true;
      if (this.item.initCallback) {
        this.item.initCallback(this.item, this);
      }
      if (this.gridster.options.itemInitCallback) {
        this.gridster.options.itemInitCallback(this.item, this);
      }
      if (this.gridster.$options.scrollToNewItems) {
        this.el.scrollIntoView(false);
      }
    }
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      if (this.gridster.options.itemResizeCallback) {
        this.gridster.options.itemResizeCallback(this.item, this);
      }
    }
    this.top = top;
    this.left = left;
  }

  itemChanged(): void {
    if (this.gridster.options.itemChangeCallback) {
      this.gridster.options.itemChangeCallback(this.item, this);
    }
  }

  checkItemChanges(newValue: GridsterItem, oldValue: GridsterItem): void {
    if (newValue.rows === oldValue.rows && newValue.cols === oldValue.cols && newValue.x === oldValue.x && newValue.y === oldValue.y) {
      return;
    }
    if (this.gridster.checkCollision(this.$item)) {
      this.$item.x = oldValue.x || 0;
      this.$item.y = oldValue.y || 0;
      this.$item.cols = oldValue.cols || 1;
      this.$item.rows = oldValue.rows || 1;
      this.setSize();
    } else {
      this.item.cols = this.$item.cols;
      this.item.rows = this.$item.rows;
      this.item.x = this.$item.x;
      this.item.y = this.$item.y;
      if (!this.gridster.$options.draggable.dropOverItemStack) {
        // 自由布局下调整大小松开鼠标时这里会影响到其他的item
        this.gridster.calculateLayoutDebounce();
      }
      this.itemChanged();
    }
  }

  canBeDragged(): boolean {
    return !this.gridster.mobile &&
      (this.$item.dragEnabled === undefined ? this.gridster.$options.draggable.enabled : this.$item.dragEnabled);
  }

  canBeResized(): boolean {
    return !this.gridster.mobile &&
      (this.$item.resizeEnabled === undefined ? this.gridster.$options.resizable.enabled : this.$item.resizeEnabled);
  }

}
