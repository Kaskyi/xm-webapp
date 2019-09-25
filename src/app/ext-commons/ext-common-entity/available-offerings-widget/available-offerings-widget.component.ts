import { HttpResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { JhiEventManager } from 'ng-jhipster';
import { Subscription } from 'rxjs';

import { I18nNamePipe, Principal } from '../../../shared/';
import { FunctionCallDialogComponent, FunctionService, XmEntity, XmEntityService } from '../../../xm-entity/';
import { XM_EVENT_LIST } from '../../../xm.constants';

@Component({
    selector: 'xm-available-offerings-widget',
    templateUrl: './available-offerings-widget.component.html',
    styleUrls: ['./available-offerings-widget.component.scss']
})
export class AvailableOfferingsWidgetComponent implements OnInit, OnDestroy {

    private availableOfferingActionSuccessSubscription: Subscription;

    config: any;
    offerings: any[];
    rowSize: number;
    rows: any[];
    noOfferings = false;

    constructor(public principal: Principal,
                private eventManager: JhiEventManager,
                private xmEntityService: XmEntityService,
                private functionService: FunctionService,
                private modalService: NgbModal,
                private translateService: TranslateService,
                private i18nNamePipe: I18nNamePipe) {
    }

    ngOnInit() {
        this.rowSize = this.config.rowSize ? this.config.rowSize : 3;
        this.load();
        this.availableOfferingActionSuccessSubscription = this.eventManager.subscribe(XM_EVENT_LIST.XM_FUNCTION_CALL_SUCCESS,
            (response) => this.load());
    }

    ngOnDestroy() {
        if (this.availableOfferingActionSuccessSubscription) {
            this.eventManager.destroy(this.availableOfferingActionSuccessSubscription);
        }
    }

    load() {
        if (this.config.query) {
            this.xmEntityService.search({query: this.config.query}).subscribe(
                (resp: XmEntity[]) => {
                    this.offerings = resp;
                    this.rows = Array.from(Array(Math.ceil(this.offerings.length / this.rowSize)).keys());
                },
                () => {
                    this.noOfferings = true;
                });
        } else if (this.config.functionKey) {
            this.functionService.call(this.config.functionKey, {}).subscribe(
                (resp: HttpResponse<any>) => {
                    this.offerings = resp.body.data.data;
                    this.rows = Array.from(Array(Math.ceil(this.offerings.length / this.rowSize)).keys());
                },
                () => {
                    this.noOfferings = true;
                });
        }
    }

    resolveAvatarUrl(offering) {
        if (offering && offering.avatarUrl && !offering.avatarUrl.startsWith('http')) {
            return 'https://xm-avatar-rgw.icthh.com/' + offering.avatarUrl;
        }
        return offering ? offering.avatarUrl : null;
    }

   public onAction(offering): void {
        const modalRef = this.modalService.open(FunctionCallDialogComponent, {backdrop: 'static'});
        modalRef.componentInstance.xmEntity = offering;
        modalRef.componentInstance.functionSpec = {key: this.config.action.functionKey};
        this.translateService.get('ext-common-entity.available-offerings-widget.action-dialog.question', {
            action: this.i18nNamePipe.transform(this.config.action.name, this.principal),
            name: offering.name
        }).subscribe(result => {
            modalRef.componentInstance.dialogTitle = result;
        });
        modalRef.componentInstance.buttonTitle = this.config.action.name;
    }

}
