import * as Yup from 'yup';
import { Op } from 'sequelize';
import Recipient from '../models/Recipient';
import Delivery from '../models/Delivery';

class RecipientController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      address_street: Yup.string().required(),
      address_number: Yup.number().required(),
      address_complement: Yup.string(),
      state: Yup.string().required(),
      city: Yup.string().required(),
      zip_code: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Verifique os dados informados' });
    }

    const userExists = await Recipient.findOne({
      where: { name: req.body.name },
    });

    if (userExists) {
      return res
        .status(400)
        .json({ error: 'Já existe um destinatário com esse nome' });
    }

    const {
      id,
      name,
      address_street,
      address_number,
      address_complement,
      state,
      city,
      zip_code,
    } = await Recipient.create(req.body);

    return res.json({
      id,
      name,
      address_street,
      address_number,
      address_complement,
      state,
      city,
      zip_code,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      address_street: Yup.string(),
      address_number: Yup.number(),
      address_complement: Yup.string(),
      state: Yup.string(),
      city: Yup.string(),
      zip_code: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Verifique os dados informados' });
    }

    const { name } = req.body;

    const recipient = await Recipient.findByPk(req.params.id);

    if (!recipient) {
      return res.status(400).json({ error: 'Destinatário não encontrado' });
    }

    if (name && name !== recipient.name) {
      const recipientExists = await Recipient.findOne({
        where: { name },
      });

      if (recipientExists) {
        return res
          .status(400)
          .json({ error: 'Já existe um destinatário com esse nome' });
      }
    }

    const {
      id,
      address_street,
      address_number,
      address_complement,
      state,
      city,
      zip_code,
    } = await recipient.update(req.body);

    return res.json({
      id,
      name,
      address_street,
      address_number,
      address_complement,
      state,
      city,
      zip_code,
    });
  }

  async index(req, res) {
    const { q } = req.query;

    let where = [{ removed_at: null }];
    where = q ? [...where, { name: { [Op.iLike]: `%${q}%` } }] : where;

    const recipients = await Recipient.findAll({
      where,
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
    });

    return res.json(recipients);
  }

  async show(req, res) {
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id, {
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
    });

    if (!recipient) {
      return res.status(400).json({ error: 'Destinatário não encontrado' });
    }

    return res.json(recipient);
  }

  async delete(req, res) {
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id, {
      attributes: ['id', 'removed_at'],
    });

    if (!recipient) {
      return res.status(401).json({ error: 'Destinatário não encontrado' });
    }

    if (recipient.removed_at) {
      return res
        .status(401)
        .json({ error: 'Este destinatário já foi excluído' });
    }

    const deliveryOpen = await Delivery.findOne({
      where: { recipient_id: id, canceled_at: null, end_date: null },
    });

    if (deliveryOpen) {
      return res.status(401).json({
        error: 'Existe uma encomenda em aberto para este destinatário',
      });
    }

    recipient.removed_at = new Date();

    await recipient.save();

    return res.json(recipient);
  }
}

export default new RecipientController();
