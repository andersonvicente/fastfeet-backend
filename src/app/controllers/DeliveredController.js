import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';

class DeliveredController {
  async index(req, res) {
    const { deliverymanId } = req.params;

    const deliveries = await Delivery.findAll({
      attributes: ['id', 'product', 'created_at', 'start_date', 'end_date'],
      where: {
        deliveryman_id: deliverymanId,
        end_date: {
          [Op.not]: null,
        },
      },
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'name',
            'address_street',
            'address_number',
            'address_complement',
            'city',
            'state',
            'zip_code',
          ],
        },
      ],
    });

    return res.json(deliveries);
  }
}

export default new DeliveredController();
