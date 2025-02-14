import { SubTopicMaster } from '../models/subTopicMaster';

class SubTopicService {
  static getInstance() {
    return new SubTopicService();
  }

  async findByName(name: string) {
    return SubTopicMaster.findOne({
      where: { name },
      attributes: ['identifier'],
    });
  }
}

export const subTopicService = SubTopicService.getInstance();
