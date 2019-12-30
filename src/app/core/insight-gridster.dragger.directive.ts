import { Directive, ElementRef, HostListener, Input, Renderer2, Output } from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[insightGridsterDragger]'
})
export class InsightGridsterDraggerDirective {

  /** 拖拽对象 */
  draggingItem: any;
  @Input()
  public set insightGridsterDragger(item: any) {
    this.draggingItem = item;
  }

  @Input()
  insightWrapOptions: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    // 增加可拖拽属性
    this.renderer.setAttribute(this.el.nativeElement, 'draggable', 'true');
  }

  /** 拖拽中事件 */
  @HostListener('dragstart', ['$event'])
  ondragStart(evt: DragEvent) {
    const oldDraging = this.el.nativeElement.ownerDocument.querySelectorAll('[dragChannel]');
    if (oldDraging && oldDraging.length) {
      for (let index = 0; index < oldDraging.length; index++) {
        this.renderer.removeAttribute(oldDraging[index], 'dragChannel');
      }
    }
    this.renderer.setAttribute(this.el.nativeElement, 'dragChannel', 'gridster');
    console.log(this.el.nativeElement)
    if (evt.dataTransfer) {
      evt.dataTransfer.setData('text', 'dragging .... ');
      evt.dataTransfer.dropEffect = 'copy';
    }
    // this.eventService.broadcast({
    //   eventName: InsightEventNames.emptyChartDragStart,
    //   param: this.draggingItem
    // });
  }

  /** 拖拽中事件 */
  @HostListener('dragend', ['$event'])
  ondragEnd(evt: DragEvent) {

    this.renderer.removeAttribute(this.el.nativeElement, 'dragChannel');
  }

}
