import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import DeliveryProblem from '../models/DeliveryProblem';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';

import CancelDeliveryMail from '../jobs/CancelDeliveryMail';
import Queue from '../../lib/Queue';

class DeliveryProblemController {
  async index(req, res) {
    const deliveryProblems = await DeliveryProblem.findAll({
      attributes: ['id', 'description', 'created_at'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'start_date', 'canceled_at'],
        },
      ],
    });

    return res.json(deliveryProblems);
  }

  async show(req, res) {
    const { deliveryId } = req.params;

    const deliveryProblems = await DeliveryProblem.findAll({
      where: {
        delivery_id: deliveryId,
      },
      attributes: ['id', 'description', 'created_at'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'start_date', 'canceled_at'],
        },
      ],
    });

    return res.json(deliveryProblems);
  }

  async store(req, res) {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(401).json({ error: 'Delivery not exists' });
    }

    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    req.body.delivery_id = deliveryId;

    const { id, delivery_id, description } = await DeliveryProblem.create(
      req.body
    );

    return res.json({
      id,
      delivery_id,
      description,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const deliveryProblem = await DeliveryProblem.findByPk(id, {
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'canceled_at'],
          include: [
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['id', 'name', 'email'],
            },
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'id',
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
        },
      ],
    });

    if (!deliveryProblem) {
      return res.status(401).json({ error: 'Problem not found' });
    }

    if (deliveryProblem.delivery.canceled_at) {
      return res.status(401).json({ error: 'Delivery is already canceled' });
    }

    deliveryProblem.delivery.canceled_at = new Date();

    await deliveryProblem.delivery.save();

    await Queue.add(CancelDeliveryMail.key, {
      deliveryProblem,
    });

    return res.json(deliveryProblem);
  }
}

export default new DeliveryProblemController();
