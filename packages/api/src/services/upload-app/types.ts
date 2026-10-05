/** GET /upload_app response: a presigned S3 URL and the keys identifying the object. */
export interface ApiPresignedUpload {
  url: string;
  file_key: string;
  file_key_signed: string;
}

/** POST /upload_app response: the grant keys plus the id of the submission it created. */
export interface ApiUploadedApp extends ApiPresignedUpload {
  submission_id: number;
}

/** POST /upload_app_url response: the id and url of the upload it created. */
export interface ApiUploadedAppUrl {
  id: number;
  url: string;
}

/** 429 response body: how many seconds until the next upload is accepted. */
export interface ApiUploadRateLimit {
  lock_time: number;
}
