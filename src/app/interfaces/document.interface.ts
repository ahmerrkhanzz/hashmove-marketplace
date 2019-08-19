import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";

export interface DocumentFile {
  fileName: string;
  fileType: string;
  fileBaseString: string;
  whole?: any;
  path?: any;
}

export interface MetaInfoKeysDetail {
  DocumentMetaInfoKeyID: number;
  KeyName: string;
  KeyNameDesc: string;
  KeyValue?: string;
  IsMandatory: boolean;
  DataType: string;
  SortingOrder: number;
  DocumentTypeID: number;
  DocumentID?: number;
  FieldLength: number
  DateModel?: NgbDateStruct;
}

export interface UserDocument {
  DocumentTypeID: number;
  DocumentTypeCode: string;
  DocumentTypeName: string;
  DocumentTypeDesc: string;
  SortingOrder: number;
  DocumentSubProcess: string;
  DocumentID?: number;
  UserID?: number;
  BookingID?: number,
  CompanyID?: number,
  ProviderID?: number,
  DocumentName: string;
  DocumentDesc: string;
  DocumentFileName?: string;
  DocumentFileContent: string;
  DocumentUploadedFileType?: string;
  DocumentLastStatus?: string;
  ExpiryStatusCode: string;
  ExpiryStatusMessage: string;
  DocumentUploadDate?: string;
  IsDownloadable: boolean;
  IsApprovalRequired: boolean;
  MetaInfoKeysDetail: MetaInfoKeysDetail[];
  ShowUpload?: boolean;
  DocumentNature?: string;
  IsUploadable?: boolean;
  ReasonID?: number;
  ReasonName?: string;
  DocumentStausRemarks?: string;
}
