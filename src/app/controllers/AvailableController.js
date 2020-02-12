import * as Yup from 'yup';
import { Op } from 'sequelize';
import { getHours, parseISO, startOfDay, endOfDay } from 'date-fns';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import File from '../models/File';

class AvailableController {
  async index(req, res) {
    const { deliverymanId } = req.params;

    const deliveries = await Delivery.findAll({
      attributes: ['id', 'product', 'start_date'],
      where: {
        deliveryman_id: deliverymanId,
        canceled_at: null,
        end_date: null,
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

  async update(req, res) {
    const schema = Yup.object().shape({
      signature_id: Yup.number(),
      start_date: Yup.date(),
      end_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { deliverymanId, deliveryId } = req.params;
    const { signature_id, start_date, end_date } = req.body;

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(401).json({ error: 'Delivery not exists' });
    }

    if (start_date) {
      const parsedDate = parseISO(start_date);

      if (!(getHours(parsedDate) >= 8 && getHours(parsedDate) <= 18)) {
        return res
          .status(401)
          .json({ error: 'Start date must be between 8 hours and 18 hours' });
      }

      const withdraws = await Delivery.findAll({
        where: {
          deliveryman_id: deliverymanId,
          start_date: {
            [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
          },
        },
      });

      if (withdraws && withdraws.length > 5) {
        return res
          .status(401)
          .json({ error: 'It exceeded the maximun of 5 withdrawals' });
      }
    }

    if (end_date && signature_id) {
      const fileExists = await File.findByPk(signature_id);

      if (!fileExists) {
        return res.status(401).json({ error: 'File not found' });
      }
    }

    await delivery.update(req.body);

    const updated = await Delivery.findByPk(deliveryId, {
      attributes: ['id', 'product', 'start_date', 'end_date'],
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json(updated);
  }
}

export default new AvailableController();
