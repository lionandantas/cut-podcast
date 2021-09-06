import PartDTO from './part.dto';

export default class VideoDTO {
  name: string;
  url: string;
  description: string;
  title: string;
  downloaded: boolean;
  initiated: boolean;
  parts: PartDTO[];
}
