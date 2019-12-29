import { Component, OnInit } from '@angular/core';
import {DisplayGrid, GridsterComponent, GridsterConfig, GridsterItem, GridsterItemComponentInterface, GridType, CompactType} from 'angular-gridster2';

@Component({
  selector: 'app-extend-fn',
  templateUrl: './extend-fn.component.html',
  styleUrls: ['./extend-fn.component.css']
})
export class ExtendFnComponent implements OnInit {
  options: GridsterConfig;
  dashboard: Array<GridsterItem> = [];
  emptyCellDropChannel: string = 'dragChannel';

  item = {
    defaultSubType: 'bar',
    message: 'test',
    subTypes: null
  }

  private _background: string;
  private _bgType: 'img' | 'color';

  static eventStart(item: GridsterItem, itemComponent: GridsterItemComponentInterface, event: MouseEvent) {
    // console.info('eventStart', item, itemComponent, event);
  }

  static eventStop(item: GridsterItem, itemComponent: GridsterItemComponentInterface, event: MouseEvent) {
    // console.info('eventStop', item, itemComponent, event);
  }

  static overlapEvent(source: GridsterItem, target: GridsterItem, grid: GridsterComponent) {
    // console.log('overlap', source, target, grid);
  }

  ngOnInit() {
    this.options = {
      compactType: CompactType.CompactUpAndLeft,
      minCols: 12,
      minRows: 12,
      defaultItemCols: 12,
      defaultItemRows: 12,
      maxCols: 12,
      maxRows: 12,
      minItemCols: 2,
      minItemRows: 1,
      gridType: GridType.Fit,
      displayGrid: DisplayGrid.None,
      useTransformPositioning: false,
      pushItems: false,
      disablePushOnDrag: false,
      disablePushOnResize: false,
      pushResizeItems: true,
      scrollToNewItems: true,
      swap: false,
      draggable: {
        delayStart: 0,
        enabled: true,
        // ignoreContentClass: 'gridster-item-content',
        // ignoreContent: true,
        dragHandleClass: 'drag-handler',
        stop: ExtendFnComponent.eventStop,
        start: ExtendFnComponent.eventStart,
        dropOverItems: true,
        dropOverItemsCallback: ExtendFnComponent.overlapEvent,
        dropOverItemStack: true,
        dropOverItemSplit:true,
      },
      resizable: {
        enabled: true
      },
      enableEmptyCellDrop: true,
      emptyCellDropChannel: this.emptyCellDropChannel,
      emptyCellDropCallback: this.createItem.bind(this),

    };
  }

  changedOptions() {
    if (this.options.api && this.options.api.optionsChanged) {
      this.dashboard = [];
      this.options.api.optionsChanged();
    }
  }

    /**
   * 创建一个图表
   */
  createItem(event: MouseEvent, item: GridsterItem) {
    item.minItemRows = this.options.minItemRows;
    item.minItemCols = this.options.minItemCols;
    this.dashboard.push(item);
  }


  get backgroundStyle() {
    if (this._bgType === 'color') {
      return { 'background-color': this._background };
    } else {
      return {
        'background-image': this._background,
        'background-size': 'cover',
        'background-repeat': 'no-repeat'
      };
    }
  }

  removeItem($event, item) {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboard.splice(this.dashboard.indexOf(item), 1);
  }

  addItem() {
    this.dashboard.push({x: 0, y: 0, cols: 1, rows: 1});
  }

}
