import * as Yup from 'yup';
import { Op } from 'sequelize';
import Deliveryman from '../models/Deliveryman';
import Delivery from '../models/Delivery';
import File from '../models/File';

class DeliverymanController {
  async index(req, res) {
    const { q } = req.query;

    let where = [{ removed_at: null }];
    where = q ? [...where, { name: { [Op.iLike]: `%${q}%` } }] : where;

    const deliverymen = await Deliveryman.findAll({
      where,
      attributes: ['id', 'name', 'email', 'removed_at'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    return res.json(deliverymen);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Verifique os dados informados' });
    }

    const deliverymanExists = await Deliveryman.findOne({
      where: { email: req.body.email },
    });

    if (deliverymanExists) {
      return res
        .status(400)
        .json({ error: 'Já existe um entregador com este e-mail' });
    }

    const { id, name, email } = await Deliveryman.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async show(req, res) {
    const { id } = req.params;

    const deliverymen = await Deliveryman.findByPk(id, {
      attributes: ['id', 'name', 'email', 'created_at', 'removed_at'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    if (!deliverymen) {
      return res.status(400).json({ error: 'Entregador não localizado' });
    }

    return res.json(deliverymen);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      avatar_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Verifique os dados informados' });
    }

    const { id } = req.params;
    const { email } = req.body;

    const deliveryman = await Deliveryman.findByPk(id);

    if (email && email !== deliveryman.email) {
      const deliverymanExists = await Deliveryman.findOne({
        where: { email },
      });

      if (deliverymanExists) {
        return res
          .status(400)
          .json({ error: 'Já existe um outro entregador com este e-mail' });
      }
    }

    const { name, avatar_id } = await deliveryman.update(req.body);

    return res.json({
      id,
      name,
      email,
      avatar_id,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const deliveryman = await Deliveryman.findByPk(id, {
      attributes: ['id', 'name', 'email', 'removed_at'],
    });

    if (deliveryman.removed_at) {
      return res.status(401).json({ error: 'Este entregador já foi excluído' });
    }

    const deliveryOpen = await Delivery.findOne({
      where: { deliveryman_id: id, canceled_at: null, end_date: null },
    });

    if (deliveryOpen) {
      return res.status(401).json({
        error: 'Existe uma encomenda em aberto para este entregador',
      });
    }

    deliveryman.removed_at = new Date();

    await deliveryman.save();

    return res.json(deliveryman);
  }
}

export default new DeliverymanController();
