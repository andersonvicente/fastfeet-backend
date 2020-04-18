import * as Yup from 'yup';
import { parseISO, getHours } from 'date-fns';
import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import File from '../models/File';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

import NewDeliveryMail from '../jobs/NewDeliveryMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  async index(req, res) {
    const { q } = req.query;

    const where = q ? { product: { [Op.iLike]: `%${q}%` } } : null;

    const deliveries = await Delivery.findAll({
      where,
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'address_street',
            'address_number',
            'address_complement',
            'state',
            'city',
            'zip_code',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'path', 'url'],
            },
          ],
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    return res.json(deliveries);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Verifique os dados informados' });
    }

    const { id } = await Delivery.create(req.body);

    const delivery = await Delivery.findByPk(id, {
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'address_street',
            'address_number',
            'address_complement',
            'state',
            'city',
            'zip_code',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    await Queue.add(NewDeliveryMail.key, {
      delivery,
    });

    const { recipient, deliveryman, product } = delivery;

    return res.json({
      id,
      recipient,
      deliveryman,
      product,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      signature_id: Yup.number(),
      start_date: Yup.date(),
      end_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Verifique os dados informados' });
    }

    const { id } = req.params;
    const { signature_id, start_date } = req.body;

    const delivery = await Delivery.findByPk(id);

    if (signature_id) {
      const fileExists = await File.findByPk(signature_id);

      if (!fileExists) {
        return res.status(401).json({ error: 'Arquivo não encontrado' });
      }
    }

    if (start_date) {
      if (
        !(
          getHours(parseISO(start_date)) >= 8 &&
          getHours(parseISO(start_date)) <= 18
        )
      ) {
        return res
          .status(401)
          .json({ error: 'A retirada deve ser entre 8 e 18 horas' });
      }
    }

    const { recipient_id, deliveryman_id, product } = await delivery.update(
      req.body
    );

    return res.json({
      id,
      recipient_id,
      deliveryman_id,
      product,
    });
  }

  async delete(req, res) {
    const delivery = await Delivery.findByPk(req.params.id, {
      attributes: ['id', 'product', 'canceled_at', 'start_date', 'end_date'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'address_street',
            'address_number',
            'address_complement',
            'state',
            'city',
            'zip_code',
          ],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (delivery.canceled_at) {
      return res.status(401).json({ error: 'Essa encomenda já foi cancelada' });
    }

    if (delivery.start_date) {
      return res.status(401).json({
        error: 'Essa encomenda já foi retirada pelo entregador',
      });
    }

    if (delivery.end_date) {
      return res
        .status(401)
        .json({ error: 'Essa encomenda já foi entregue' });
    }

    delivery.canceled_at = new Date();

    await delivery.save();

    return res.json(delivery);
  }
}

export default new DeliveryController();
