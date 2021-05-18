import AutoDelete from '../models/AutoDelete';

export const insertAutoDelete = (uid: BigInt, gid: BigInt) => AutoDelete.create({
  uid: uid.toString(),
  gid: gid.toString(),
});

export const getAutoDelete = (uid: BigInt, gid: BigInt) => AutoDelete.findOne({
  where: {
    uid: uid.toString(),
    gid: gid.toString(),
  },
});

export const deleteAutoDelete = (uid: BigInt, gid: BigInt) => AutoDelete.destroy({
  where: {
    uid: uid.toString(),
    gid: gid.toString(),
  },
});

export const getAllAutoDelete = () => AutoDelete.findAll();
