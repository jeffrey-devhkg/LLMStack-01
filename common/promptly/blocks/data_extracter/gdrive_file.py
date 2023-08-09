# AUTOGENERATED
from typing import Dict
from typing import Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from common.promptly.core.base import BaseConfiguration
from common.promptly.core.base import BaseConfigurationType
from common.promptly.core.base import BaseInput
from common.promptly.core.base import BaseInputType
from common.promptly.core.base import BaseOutput
from common.promptly.core.base import BaseOutputType
from common.promptly.core.base import BaseProcessor
from common.promptly.core.base import Schema


class GoogleDriveFileData(Schema):
    metadata: Dict[str, str]
    content: str
    file_id: str


class GoogleDriveDataExtractorBlockInput(BaseInput):
    file_id: str


class GoogleDriveDataExtractorBlockOutput(BaseOutput):
    result: GoogleDriveFileData


class GoogleDriveDataExtractorBlockConfiguration(BaseConfiguration):
    credentials: Dict[str, str]


class GoogleDriveDataExtractorBlock(BaseProcessor[GoogleDriveDataExtractorBlockInput, GoogleDriveDataExtractorBlockOutput, GoogleDriveDataExtractorBlockConfiguration], Generic[BaseInputType, BaseOutputType, BaseConfigurationType]):

    def __init__(self, configuration: dict):
        super().__init__(configuration)
        credentials = Credentials.from_authorized_user_info(
            info=configuration['credentials'],
        )
        self._drive_service = build('drive', 'v3', credentials=credentials)

    def _get_file_metadata(self, file_id: str) -> Dict[str, str]:
        file = self._drive_service.files().get(fileId=file_id, fields='*').execute()
        return file

    def _get_file_content(self, file_id: str, mime_type: str) -> str:
        content = self._drive_service.files().export(
            fileId=file_id, mimeType=mime_type,
        ).execute()
        return content.decode('utf-8')

    def _process(self, input: GoogleDriveDataExtractorBlockInput, configuration: GoogleDriveDataExtractorBlockConfiguration) -> GoogleDriveDataExtractorBlockOutput:
        metadata = self._get_file_metadata(input.file_id)
        mime_type = metadata['mimeType']

        if mime_type == 'application/vnd.google-apps.document':
            content = self._get_file_content(input.file_id, 'text/plain')
        elif mime_type == 'application/vnd.google-apps.spreadsheet':
            content = self._get_file_content(
                input.file_id, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            )
        elif mime_type == 'application/vnd.google-apps.presentation':
            content = self._get_file_content(
                input.file_id, 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            )
        else:
            raise Exception('Unsupported file type')

        return GoogleDriveDataExtractorBlockOutput(result=GoogleDriveFileData(metadata=metadata, content=content, file_id=input.file_id))